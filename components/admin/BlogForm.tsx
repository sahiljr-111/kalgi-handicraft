'use client';

import { ArrowLeft, ChevronDown, Eye } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button, Card, Field, Input, Select, Skeleton, Textarea } from '@/components/ui';
import { ApiError, api } from '@/lib/client';
import { postSeoDescription, postSeoTitle } from '@/lib/seo';
import type { BlogPost, Category } from '@/lib/types';
import { useApi } from '@/lib/useApi';
import { BLOG_TOPICS, cn, slugify } from '@/lib/utils';
import { ImageField } from './MediaPicker';
import { GooglePreview, NoindexSwitch } from './SeoFields';

const RichTextEditor = dynamic(() => import('./RichTextEditor').then((m) => m.RichTextEditor), {
  ssr: false,
  loading: () => <Skeleton className="h-[420px]" />,
});

type Publish = 'draft' | 'now' | 'schedule';

/** ISO date → value for <input type="datetime-local"> in the browser's time zone. */
function toLocalInput(iso: string | null | undefined) {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

/** draft, scheduled (published with a future date) or live. */
export function postState(p: Pick<BlogPost, 'status' | 'publishedAt'>) {
  if (p.status !== 'published') return 'draft' as const;
  return p.publishedAt && new Date(p.publishedAt) > new Date() ? ('scheduled' as const) : ('live' as const);
}

export function BlogForm({ post }: { post?: BlogPost }) {
  const router = useRouter();
  const { data: categories } = useApi<Category[]>('/categories?all=true');
  const [v, setV] = useState({
    title: post?.title ?? '',
    slug: post?.slug ?? '',
    excerpt: post?.excerpt ?? '',
    content: post?.content ?? '',
    featuredImage: post?.featuredImage ?? '',
    featuredImageAlt: post?.featuredImageAlt ?? '',
    topic: post?.topic ?? '',
    tags: (post?.tags ?? []).join(', '),
    relatedCategory: typeof post?.relatedCategory === 'object' && post?.relatedCategory ? post.relatedCategory._id : (post?.relatedCategory as string) ?? '',
    author: post?.author ?? 'Kalgi Handicraft',
    seoTitle: post?.seoTitle ?? '',
    seoDescription: post?.seoDescription ?? '',
    ogImage: post?.ogImage ?? '',
    canonicalUrl: post?.canonicalUrl ?? '',
    noindex: post?.noindex ?? false,
  });
  const initialState = post ? postState(post) : 'draft';
  const [publish, setPublish] = useState<Publish>(initialState === 'scheduled' ? 'schedule' : initialState === 'live' ? 'now' : 'draft');
  const [when, setWhen] = useState(initialState === 'scheduled' ? toLocalInput(post?.publishedAt) : '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [state, setState] = useState(initialState);
  const [slug, setSlug] = useState(post?.slug ?? '');
  const set = (patch: Partial<typeof v>) => setV((x) => ({ ...x, ...patch }));

  const topics = useMemo(() => [...new Set([...BLOG_TOPICS, ...(v.topic ? [v.topic] : [])])], [v.topic]);
  const seo = useMemo(() => {
    const draft = { title: v.title || 'Blog title', excerpt: v.excerpt, seoTitle: v.seoTitle, seoDescription: v.seoDescription } as BlogPost;
    const auto = { ...draft, seoTitle: '', seoDescription: '' };
    return { title: postSeoTitle(draft), description: postSeoDescription(draft), autoTitle: postSeoTitle(auto), autoDescription: postSeoDescription(auto) };
  }, [v.title, v.excerpt, v.seoTitle, v.seoDescription]);

  async function save() {
    const errs: Record<string, string> = {};
    if (v.title.trim().length < 3) errs.title = 'Please type a title';
    if (publish === 'schedule' && (!when || new Date(when) <= new Date())) errs.publishedAt = 'Pick a date and time in the future';
    if (v.featuredImage && !v.featuredImageAlt.trim()) errs.featuredImageAlt = 'Describe the photo in a few words (helps Google and blind readers)';
    if (Object.keys(errs).length) {
      setErrors(errs);
      toast.error(Object.values(errs)[0]);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const body = {
        ...v,
        tags: v.tags.split(',').map((t) => t.trim()).filter(Boolean),
        status: publish === 'draft' ? 'draft' : 'published',
        // Publish now keeps the original date when it was already live.
        publishedAt: publish === 'schedule' ? new Date(when).toISOString() : publish === 'now' && initialState === 'scheduled' ? new Date().toISOString() : '',
      };
      const saved = post ? await api.put<BlogPost>(`/blog/${post._id}`, body) : await api.post<BlogPost>('/blog', body);
      setSlug(saved.slug);
      set({ slug: saved.slug });
      const next = postState(saved);
      setState(next);
      toast.success(next === 'live' ? 'Saved. It is now on your website.' : next === 'scheduled' ? 'Saved. It will go live at the time you picked.' : 'Saved as a draft. Visitors cannot see it.');
      if (!post) router.replace(`/admin/blog/${saved._id}/edit`);
    } catch (e) {
      if (e instanceof ApiError) setErrors(e.fields);
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      className="pb-24"
    >
      <Link href="/admin/blog" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-navy hover:underline">
        <ArrowLeft className="size-4" /> Back to all blogs
      </Link>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl leading-tight font-semibold text-stone-900">{post ? 'Edit blog' : 'Write a blog'}</h1>
          <p className="mt-2 text-sm text-stone-600">Write in simple words, like you would explain it to a customer.</p>
        </div>
        {post && (
          <a href={`/api/blog/preview?id=${post._id}`} target="_blank" className="inline-flex items-center gap-2 text-sm font-semibold text-navy hover:underline">
            <Eye className="size-4" /> {state === 'live' ? 'View on website' : 'Preview'}
          </a>
        )}
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_320px]">
        <div className="grid min-w-0 gap-4">
          <Card className="grid gap-5 p-5">
            <Field label="Title" htmlFor="b-title" error={errors.title}>
              <Input id="b-title" value={v.title} invalid={Boolean(errors.title)} onChange={(e) => set({ title: e.target.value, ...(!post && { slug: slugify(e.target.value) }) })} placeholder="For example: How to choose a chowki for your mandir" />
            </Field>
            <Field label="Short summary" htmlFor="b-excerpt" hint="One or two sentences shown in the list of blogs and on Google.">
              <Textarea id="b-excerpt" rows={2} value={v.excerpt} maxLength={500} onChange={(e) => set({ excerpt: e.target.value })} />
            </Field>
            <div>
              <p className="mb-2 text-sm font-semibold text-stone-900">Blog content</p>
              <p className="mb-2 text-xs text-stone-500">Use “Heading” for each section. Headings become the “In this blog” list on the website.</p>
              <RichTextEditor value={v.content} onChange={(content) => set({ content })} />
            </div>
          </Card>

          <Card>
            <button type="button" onClick={() => setAdvanced((a) => !a)} aria-expanded={advanced} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
              <span>
                <span className="block text-sm font-semibold text-stone-900">Google & sharing (optional)</span>
                <span className="block text-sm text-stone-600">Filled in automatically from the title and summary. Change only if you need to.</span>
              </span>
              <ChevronDown className={cn('size-5 shrink-0 text-stone-500 transition', advanced && 'rotate-180')} />
            </button>
            {advanced && (
              <div className="grid gap-5 border-t border-stone-100 p-5">
                <GooglePreview path={`/blog/${v.slug || '…'}`} title={seo.title} description={seo.description} />
                <Field label="Web address" htmlFor="b-slug" hint={`/blog/${v.slug || '…'}. If you change it after publishing, the old address forwards to the new one automatically.`} error={errors.slug}>
                  <Input id="b-slug" value={v.slug} onChange={(e) => set({ slug: slugify(e.target.value) })} />
                </Field>
                <Field label="Title in Google search" htmlFor="b-seot" hint="Leave empty to use the automatic title.">
                  <Input id="b-seot" value={v.seoTitle} maxLength={120} placeholder={seo.autoTitle} onChange={(e) => set({ seoTitle: e.target.value })} />
                </Field>
                <Field label="Short description in Google search" htmlFor="b-seod" hint="Leave empty to use the summary.">
                  <Textarea id="b-seod" rows={2} value={v.seoDescription} maxLength={320} placeholder={seo.autoDescription} onChange={(e) => set({ seoDescription: e.target.value })} />
                </Field>
                <ImageField value={v.ogImage} onChange={(ogImage) => set({ ogImage })} label="Photo for WhatsApp / Facebook shares (optional, uses the main photo if empty)" />
                <Field label="Original address (canonical)" htmlFor="b-canon" hint="Only if this blog was first published on another website. Otherwise leave empty." error={errors.canonicalUrl}>
                  <Input id="b-canon" value={v.canonicalUrl} placeholder="https://…" onChange={(e) => set({ canonicalUrl: e.target.value.trim() })} />
                </Field>
                <NoindexSwitch id="b-noindex" checked={v.noindex} onChange={(noindex) => set({ noindex })} />
              </div>
            )}
          </Card>
        </div>

        <div className="grid gap-4 lg:sticky lg:top-6">
          <Card className="grid gap-3 p-5">
            <p className="text-sm font-semibold text-stone-900">Publishing</p>
            {(
              [
                ['draft', 'Draft', 'Hidden from visitors.'],
                ['now', state === 'live' ? 'Published' : 'Publish now', 'Shows on the website.'],
                ['schedule', 'Schedule', 'Goes live at a date and time you pick.'],
              ] as const
            ).map(([value, label, hint]) => (
              <label key={value} className={cn('flex cursor-pointer gap-3 rounded-xl border p-3', publish === value ? 'border-navy bg-navy/5' : 'border-stone-200')}>
                <input type="radio" name="publish" value={value} checked={publish === value} onChange={() => setPublish(value)} className="mt-1 accent-navy" />
                <span>
                  <span className="block text-sm font-semibold text-stone-900">{label}</span>
                  <span className="block text-xs text-stone-600">{hint}</span>
                </span>
              </label>
            ))}
            {publish === 'schedule' && (
              <Field label="Go live on" htmlFor="b-when" error={errors.publishedAt}>
                <Input id="b-when" type="datetime-local" value={when} invalid={Boolean(errors.publishedAt)} onChange={(e) => setWhen(e.target.value)} />
              </Field>
            )}
            {post && slug && (
              <p className="text-xs text-stone-500">
                Now: {state === 'live' ? 'on the website' : state === 'scheduled' ? 'scheduled' : 'draft'}
              </p>
            )}
          </Card>

          <Card className="grid gap-5 p-5">
            <ImageField value={v.featuredImage} onChange={(featuredImage) => set({ featuredImage })} label="Main photo" />
            {v.featuredImage && (
              <Field label="Describe the photo" htmlFor="b-alt" hint="For example: Red Meenakari pooja chowki with gold floral work" error={errors.featuredImageAlt}>
                <Input id="b-alt" value={v.featuredImageAlt} maxLength={200} invalid={Boolean(errors.featuredImageAlt)} onChange={(e) => set({ featuredImageAlt: e.target.value })} />
              </Field>
            )}
            <Field label="Topic" htmlFor="b-topic" hint="Groups blogs on the website.">
              <Select id="b-topic" value={v.topic} onChange={(e) => set({ topic: e.target.value })}>
                <option value="">No topic</option>
                {topics.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="Tags" htmlFor="b-tags" hint="Separate with commas, e.g. chowki, diwali">
              <Input id="b-tags" value={v.tags} onChange={(e) => set({ tags: e.target.value })} />
            </Field>
            <Field label="Link to a category" htmlFor="b-cat" hint="Adds a “Browse” button at the end of the blog.">
              <Select id="b-cat" value={v.relatedCategory} onChange={(e) => set({ relatedCategory: e.target.value })}>
                <option value="">None</option>
                {categories?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="Written by" htmlFor="b-author">
              <Input id="b-author" value={v.author} onChange={(e) => set({ author: e.target.value })} />
            </Field>
          </Card>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-end gap-3 px-4 py-4 sm:px-5 lg:px-10">
          <Link href="/admin/blog" className="inline-flex h-9 items-center rounded-xl px-5 text-sm font-semibold text-stone-700 hover:bg-stone-100">Cancel</Link>
          <Button type="submit" size="lg" loading={saving}>
            {publish === 'draft' ? 'Save draft' : publish === 'schedule' ? 'Save & schedule' : state === 'live' ? 'Save changes' : 'Publish'}
          </Button>
        </div>
      </div>
    </form>
  );
}
