import { CalendarDays, Clock, MessageCircle, RefreshCw } from 'lucide-react';
import type { Metadata } from 'next';
import { draftMode } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';
import { PostCard, topicHref, topicIcon } from '@/components/site/BlogIndex';
import { BlogToc, type TocItem } from '@/components/site/BlogToc';
import { Breadcrumbs } from '@/components/site/Breadcrumbs';
import { JsonLd } from '@/components/site/JsonLd';
import { ShareButtons } from '@/components/site/ShareButtons';
import { WhatsAppButton } from '@/components/site/WhatsAppButton';
import { getBlogPage, getBlogPost, getBlogPostPreview, getBlogPosts, getBlogTopics, getSettings, redirectOrNotFound } from '@/lib/api';
import { absoluteUrl, postSeoDescription, postSeoTitle } from '@/lib/seo';
import type { BlogPostDetail, CategoryRef } from '@/lib/types';
import { SITE_URL, formatDate, mediaUrl } from '@/lib/utils';

export const revalidate = 3600;
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getBlogPosts(200)).map((p) => ({ slug: p.slug }));
}

/** Signed-in editors previewing a draft see the unpublished version. */
async function loadPost(slug: string): Promise<BlogPostDetail | null> {
  return (await draftMode()).isEnabled ? getBlogPostPreview(slug) : getBlogPost(slug);
}

const textOf = (html: string) => html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').trim();

/** h2 headings (ids are added when the post is saved) for "In this blog". */
function headings(html: string): TocItem[] {
  return [...html.matchAll(/<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g)].map((m) => ({ id: m[1], text: textOf(m[2]) }));
}

/** Question/answer pairs under a "Frequently asked questions" heading, for FAQ structured data. */
function faqs(html: string) {
  const start = html.search(/<h2 id="[^"]*">\s*(Frequently asked questions|FAQs?)\s*<\/h2>/i);
  if (start < 0) return [];
  const section = html.slice(start).split(/<h2[\s>]/).slice(0, 2).join('<h2 ');
  return [...section.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>\s*((?:<p>[\s\S]*?<\/p>\s*)+)/g)].map((m) => ({ q: textOf(m[1]), a: textOf(m[2]) })).filter((f) => f.q && f.a);
}

const words = (html: string) => html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
const longDate = (d: string) => formatDate(d, { day: 'numeric', month: 'long', year: 'numeric' });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await loadPost((await params).slug);
  if (!post) return {};
  const title = postSeoTitle(post);
  const description = postSeoDescription(post);
  const image = post.ogImage || post.featuredImage;
  const live = post.status === 'published' && post.publishedAt && new Date(post.publishedAt) <= new Date();
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: post.canonicalUrl || `/blog/${post.slug}` },
    robots: post.noindex || !live ? { index: false, follow: true } : undefined,
    openGraph: {
      type: 'article',
      title,
      description,
      url: `/blog/${post.slug}`,
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt,
      authors: [post.author],
      section: post.topic || undefined,
      tags: post.tags,
      images: image ? [{ url: absoluteUrl(image), alt: post.featuredImageAlt || post.title }] : undefined,
    },
    twitter: { card: 'summary_large_image', title, description, images: image ? [absoluteUrl(image)] : undefined },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const [post, settings, topics, { isEnabled: preview }] = await Promise.all([loadPost(slug), getSettings(), getBlogTopics(), draftMode()]);
  if (!post) return redirectOrNotFound(`/blog/${slug}`);
  const { items: recent } = await getBlogPage({ limit: 4, exclude: post._id });
  const cat = post.relatedCategory && typeof post.relatedCategory === 'object' ? (post.relatedCategory as CategoryRef) : null;
  const html = post.content ?? '';
  const toc = headings(html);
  const faq = faqs(html);
  const updated = post.publishedAt && new Date(post.updatedAt).getTime() - new Date(post.publishedAt).getTime() > 86_400_000;
  const live = post.status === 'published' && post.publishedAt && new Date(post.publishedAt) <= new Date();
  const url = `${SITE_URL}/blog/${post.slug}`;
  const TopicIcon = topicIcon(post.topic);

  return (
    <article className="site-container py-3 sm:py-6 lg:py-10">
      {preview && !live && (
        <p className="mb-6 rounded-xl border border-gold-soft bg-gold-soft/15 px-4 py-3 text-sm text-ink">
          Preview: this blog is {post.status === 'draft' ? 'a draft' : `scheduled for ${formatDate(post.publishedAt!)}`} and is not visible to visitors yet.
        </p>
      )}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Main column */}
        <div className="min-w-0 max-w-3xl">
          <Breadcrumbs
            items={[
              { name: 'Blogs', href: '/blog' },
              ...(post.topic ? [{ name: post.topic, href: topicHref(post.topic) }] : []),
              { name: post.title, href: `/blog/${post.slug}` },
            ]}
          />

          <header className="mt-3 sm:mt-5">
            <h1 className="text-[1.375rem] leading-snug text-ink sm:text-[2rem] sm:leading-[1.2] lg:text-[2.25rem]">{post.title}</h1>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted sm:mt-4 sm:gap-x-4 sm:gap-y-2 sm:text-[0.8125rem]">
              {post.publishedAt && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-4" aria-hidden="true" />
                  <time dateTime={post.publishedAt}>{longDate(post.publishedAt)}</time>
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4" aria-hidden="true" /> {Math.max(1, Math.round(words(html) / 200))} min read
              </span>
              {post.topic && (
                <Link href={topicHref(post.topic)} className="inline-flex items-center gap-1.5 rounded-full bg-paper px-3 py-1 font-medium text-ink-soft hover:text-ink">
                  <TopicIcon className="size-3.5" aria-hidden="true" /> {post.topic}
                </Link>
              )}
            </div>
          </header>

          {post.featuredImage && (
            <div className="relative mt-4 h-48 overflow-hidden rounded-xl bg-paper max-sm:-mx-4 max-sm:rounded-none sm:mt-6 sm:h-72 sm:rounded-2xl lg:h-[19rem]">
              <Image
                src={mediaUrl(post.featuredImage)}
                alt={post.featuredImageAlt || ''}
                fill
                priority
                sizes="(min-width: 1024px) 768px, 100vw"
                className="object-cover"
              />
            </div>
          )}

          {post.excerpt && <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-soft sm:mt-6 sm:text-[1.0625rem]">{post.excerpt}</p>}

          {/* On phones and tablets the contents list sits above the text, closed. */}
          {toc.length >= 3 && (
            <details className="mt-4 rounded-xl border border-line bg-white/70 px-4 py-3 sm:mt-6 sm:rounded-2xl sm:px-5 sm:py-3.5 lg:hidden">
              <summary className="cursor-pointer text-sm font-semibold text-ink">In this blog ({toc.length} sections)</summary>
              <div className="mt-3">
                <BlogToc items={toc} />
              </div>
            </details>
          )}

          {/* Content is sanitised when it is saved. */}
          <div className="prose-kalgi mt-5 sm:mt-8" dangerouslySetInnerHTML={{ __html: html }} />

          <footer className="mt-10 border-t border-line pt-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                <span>
                  By <span className="font-medium text-ink-soft">{post.author || settings.businessName}</span>
                </span>
                {updated && (
                  <span className="inline-flex items-center gap-1.5">
                    <RefreshCw className="size-3.5" aria-hidden="true" /> Updated <time dateTime={post.updatedAt}>{longDate(post.updatedAt)}</time>
                  </span>
                )}
              </p>
              <ShareButtons url={url} title={post.title} />
            </div>
            {post.tags && post.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted">Tags:</span>
                {post.tags.map((t) => (
                  <span key={t} className="rounded-full bg-paper px-3 py-1 text-xs text-ink-soft">{t}</span>
                ))}
              </div>
            )}
          </footer>

          <aside className="mt-8 rounded-2xl bg-navy p-4 text-ivory sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-7">
            <div>
              <p className="font-display text-lg sm:text-xl">{cat ? `Looking for ${cat.name.toLowerCase()}?` : 'Have a requirement in mind?'}</p>
              <p className="mt-1.5 text-sm text-ivory/75">Order any quantity. Send the product and quantity on WhatsApp for prices and photos.</p>
            </div>
            <div className="mt-5 flex shrink-0 flex-col gap-3 sm:mt-0">
              <WhatsAppButton number={settings.whatsapp} text={`Hi ${settings.businessName}, I read "${post.title}" and would like a quote.`} className="px-5 py-2.5 text-sm" />
              {cat && (
                <Link href={`/${cat.slug}`} className="inline-flex items-center justify-center rounded-full border border-ivory/30 px-5 py-2.5 text-sm font-semibold transition hover:border-gold-soft hover:text-gold-soft">
                  Browse {cat.name}
                </Link>
              )}
            </div>
          </aside>
        </div>

        {/* Sidebar */}
        <aside className="grid content-start gap-5" aria-label="More from the blog">
          {toc.length >= 3 && (
            <nav aria-label="In this blog" className="sticky top-24 z-10 hidden max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border border-line bg-ivory lg:block">
              <p className="border-b border-line px-5 py-3.5 text-sm font-semibold text-ink">In this blog</p>
              <div className="px-5 py-4">
                <BlogToc items={toc} />
              </div>
            </nav>
          )}

          {topics.length > 0 && (
            <section className="rounded-2xl border border-line bg-white/70">
              <h2 className="border-b border-line px-5 py-3.5 font-sans text-sm font-semibold text-ink">Topics</h2>
              <ul className="grid grid-cols-2 gap-1 p-3">
                {topics.map((t) => {
                  const Icon = topicIcon(t.name);
                  return (
                    <li key={t.slug}>
                      <Link href={`/blog/topic/${t.slug}`} className="flex items-start gap-2.5 rounded-xl p-2 transition hover:bg-paper">
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-paper text-gold">
                          <Icon className="size-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm leading-tight font-medium text-ink">{t.name}</span>
                          <span className="text-xs text-muted">{t.count} {t.count === 1 ? 'blog' : 'blogs'}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {recent.length > 0 && (
            <section className="rounded-2xl border border-line bg-white/70">
              <h2 className="border-b border-line px-5 py-3.5 font-sans text-sm font-semibold text-ink">Recent blogs</h2>
              <ul className="divide-y divide-line">
                {recent.map((r) => (
                  <li key={r._id}>
                    <Link href={`/blog/${r.slug}`} className="group flex gap-3 px-5 py-3.5">
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 text-sm leading-snug font-medium text-ink group-hover:text-gold">{r.title}</span>
                        {r.publishedAt && <span className="mt-1 block text-xs text-muted">{formatDate(r.publishedAt)}</span>}
                      </span>
                      {r.featuredImage && (
                        <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-paper">
                          <Image src={mediaUrl(r.featuredImage)} alt="" fill sizes="80px" className="object-cover" />
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {settings.whatsapp && (
            <section className="rounded-2xl border border-line bg-paper p-5">
              <MessageCircle className="size-5 text-gold" aria-hidden="true" />
              <p className="mt-2 font-display text-lg leading-snug text-ink">Questions about a product?</p>
              <p className="mt-1 text-sm text-muted">Ask us on WhatsApp. Any quantity, from one piece.</p>
              <WhatsAppButton number={settings.whatsapp} text={`Hi ${settings.businessName}, I have a question.`} className="mt-4 w-full px-5 py-2.5 text-sm" />
            </section>
          )}
        </aside>
      </div>

      {post.related?.length > 0 && (
        <section className="mt-10 border-t border-line pt-6 sm:mt-16 sm:pt-10">
          <h2 className="text-lg text-ink sm:text-[1.75rem]">Related blogs</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-5 lg:grid-cols-3">
            {post.related.map((p) => <PostCard key={p._id} post={p} />)}
          </div>
        </section>
      )}

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: postSeoDescription(post),
          image: post.featuredImage ? [absoluteUrl(post.featuredImage)] : undefined,
          datePublished: post.publishedAt,
          dateModified: post.updatedAt,
          articleSection: post.topic || undefined,
          keywords: post.tags?.length ? post.tags.join(', ') : undefined,
          wordCount: words(html),
          inLanguage: 'en-IN',
          author: post.author && post.author !== settings.businessName ? { '@type': 'Person', name: post.author } : { '@id': `${SITE_URL}/#business` },
          publisher: { '@id': `${SITE_URL}/#business` },
          mainEntityOfPage: url,
        }}
      />
      {faq.length > 0 && (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
          }}
        />
      )}
    </article>
  );
}
