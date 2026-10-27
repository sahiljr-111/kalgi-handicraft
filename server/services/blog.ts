import { isValidObjectId } from 'mongoose';
import sanitizeHtml from 'sanitize-html';
import { z } from 'zod';
import { connectDB } from '../db';
import { notFound } from '../http';
import { BlogPost } from '../models';
import { revalidate } from '../revalidate';
import { escapeRegex, pagination, slugify, uniqueSlug } from '../slug';
import { slugify as slugifyUrl } from '@/lib/utils';
import { recordSlugChange } from './redirects';

/** Sanitises editor HTML and gives every h2/h3 an id so articles can have a table of contents. */
function cleanHtml(html: string) {
  const used = new Set<string>();
  const clean = sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h2', 'h3', 'figure', 'figcaption']).filter((t) => t !== 'h1'),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ['src', 'alt', 'width', 'height', 'loading'],
      a: ['href', 'name', 'target', 'rel'],
      h2: ['id'],
      h3: ['id'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    transformTags: {
      // External links open in a new tab; internal links stay as they are.
      a: (tag, attribs) => {
        const external = /^https?:\/\//.test(attribs.href ?? '');
        return { tagName: 'a', attribs: external ? { ...attribs, target: '_blank', rel: 'noopener noreferrer' } : attribs };
      },
      h1: 'h2',
    },
  });
  return clean.replace(/<(h2|h3)(?:\s+id="[^"]*")?>([\s\S]*?)<\/\1>/g, (_m, tag: string, inner: string) => {
    const base = slugify(inner.replace(/<[^>]+>/g, '')).slice(0, 60) || 'section';
    let id = base;
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    used.add(id);
    return `<${tag} id="${id}">${inner}</${tag}>`;
  });
}

const postInput = z.object({
  title: z.string().trim().min(3, 'Title is required').max(200),
  slug: z.string().trim().max(200).optional().default(''),
  excerpt: z.string().trim().max(500).optional().default(''),
  content: z.string().max(300000).optional().default(''),
  featuredImage: z.string().optional().default(''),
  featuredImageAlt: z.string().trim().max(200).optional().default(''),
  topic: z.string().trim().max(60).optional().default(''),
  tags: z.array(z.string().trim().toLowerCase().min(1).max(40)).max(12).optional().default([]),
  relatedCategory: z.union([z.literal(''), z.null(), z.string().refine(isValidObjectId)]).optional(),
  author: z.string().trim().max(80).optional().default('Kalgi Handicraft'),
  seoTitle: z.string().trim().max(120).optional().default(''),
  seoDescription: z.string().trim().max(320).optional().default(''),
  ogImage: z.string().optional().default(''),
  canonicalUrl: z.union([z.literal(''), z.string().url('Enter a full URL starting with https://')]).optional().default(''),
  noindex: z.boolean().optional().default(false),
  status: z.enum(['draft', 'published']).optional().default('draft'),
  // ISO date. Empty = now when publishing. A future date schedules the post.
  publishedAt: z.union([z.literal(''), z.null(), z.coerce.date()]).optional(),
});

const toDoc = (data: z.infer<typeof postInput>) => {
  const { publishedAt, ...rest } = data;
  void publishedAt;
  return {
    ...rest,
    tags: [...new Set(data.tags)],
    content: cleanHtml(data.content),
    relatedCategory: data.relatedCategory || null,
  };
};

/** Public visibility: published and not scheduled for later. */
const livePost = () => ({ status: 'published' as const, publishedAt: { $ne: null, $lte: new Date() } });

export async function listPosts(q: Record<string, string | undefined>, isAdmin = false) {
  await connectDB();
  const { page, limit, skip } = pagination(q, 12, 200);
  let filter: Record<string, unknown> = livePost();
  if (isAdmin && q.status === 'all') filter = {};
  else if (isAdmin && q.status === 'draft') filter = { status: 'draft' };
  else if (isAdmin && q.status === 'scheduled') filter = { status: 'published', publishedAt: { $gt: new Date() } };
  if (q.topic) filter.topic = q.topic;
  if (q.tag) filter.tags = q.tag.toLowerCase();
  if (q.q) {
    const rx = new RegExp(escapeRegex(q.q.trim()), 'i');
    filter.$or = [{ title: rx }, { excerpt: rx }, { tags: rx }];
  }
  if (q.exclude && isValidObjectId(q.exclude)) filter._id = { $ne: q.exclude };
  const [items, total] = await Promise.all([
    BlogPost.find(filter).sort({ publishedAt: -1, createdAt: -1 }).skip(skip).limit(limit).select('-content').populate('relatedCategory', 'name slug').lean(),
    BlogPost.countDocuments(filter),
  ]);
  return { items, total, page, pages: Math.ceil(total / limit) };
}

/** Topics that have at least one live post, with counts. */
export async function listTopics() {
  await connectDB();
  const rows = await BlogPost.aggregate<{ _id: string; count: number }>([
    { $match: { ...livePost(), topic: { $nin: ['', null] } } },
    { $group: { _id: '$topic', count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
  ]);
  // Same slugify as the website links (lib/utils), so topic URLs always match.
  return rows.map((r) => ({ name: r._id, slug: slugifyUrl(r._id), count: r.count }));
}

export async function getPostById(id: string) {
  await connectDB();
  const post = await BlogPost.findById(id).lean();
  if (!post) throw notFound('Post');
  return post;
}

/** A post plus up to 3 related posts (same topic or shared tags first). */
export async function getPostBySlug(slug: string, isAdmin = false) {
  await connectDB();
  const post = await BlogPost.findOne({ slug }).populate('relatedCategory', 'name slug').lean();
  const live = post && post.status === 'published' && post.publishedAt && post.publishedAt <= new Date();
  if (!post || (!live && !isAdmin)) throw notFound('Post');
  const candidates = await BlogPost.find({ ...livePost(), _id: { $ne: post._id } })
    .select('-content')
    .sort({ publishedAt: -1 })
    .limit(30)
    .lean();
  const score = (p: (typeof candidates)[number]) =>
    (post.topic && p.topic === post.topic ? 2 : 0) + p.tags.filter((t) => post.tags.includes(t)).length;
  const related = candidates.sort((a, b) => score(b) - score(a)).slice(0, 3);
  return { ...post, related };
}

function publishDate(data: z.infer<typeof postInput>, current?: Date | null) {
  if (data.status !== 'published') return current ?? null;
  if (data.publishedAt instanceof Date && !Number.isNaN(+data.publishedAt)) return data.publishedAt;
  return current ?? new Date();
}

function revalidateBlog(slugs: string[], categorySlug?: string) {
  revalidate({ tags: ['blog'], paths: ['/blog', '/', ...slugs.map((s) => `/blog/${s}`), ...(categorySlug ? [`/${categorySlug}`] : [])] });
}

export async function createPost(input: unknown) {
  await connectDB();
  const data = postInput.parse(input);
  const slug = await uniqueSlug(BlogPost, data.slug || data.title);
  const post = await BlogPost.create({ ...toDoc(data), slug, publishedAt: publishDate(data) });
  revalidateBlog([slug]);
  return post.toObject();
}

export async function updatePost(id: string, input: unknown) {
  await connectDB();
  const data = postInput.parse(input);
  const post = await BlogPost.findById(id);
  if (!post) throw notFound('Post');
  const oldSlug = post.slug;
  const slug = await uniqueSlug(BlogPost, data.slug || data.title, String(post._id));
  post.set({ ...toDoc(data), slug, publishedAt: publishDate(data, post.publishedAt) });
  await post.save();
  if (post.status === 'published') await recordSlugChange('blog', oldSlug, slug);
  revalidateBlog([slug, oldSlug]);
  return post.toObject();
}

/** Publish or unpublish from the list without sending the whole post. */
export async function setPostStatus(id: string, input: unknown) {
  await connectDB();
  const { status } = z.object({ status: z.enum(['draft', 'published']) }).parse(input);
  const post = await BlogPost.findById(id);
  if (!post) throw notFound('Post');
  post.status = status;
  if (status === 'published' && !post.publishedAt) post.publishedAt = new Date();
  await post.save();
  revalidateBlog([post.slug]);
  return post.toObject();
}

export async function deletePost(id: string) {
  await connectDB();
  const post = await BlogPost.findByIdAndDelete(id);
  if (!post) throw notFound('Post');
  revalidateBlog([post.slug]);
}
