import { ArrowRight, BookOpen, CalendarDays, Gift, LayoutGrid, Newspaper, Package, Palette, Search, type LucideIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { BlogPost, BlogTopic } from '@/lib/types';
import { cn, formatDate, mediaUrl, slugify } from '@/lib/utils';

const TOPIC_ICONS: Record<string, LucideIcon> = {
  'Craft & Heritage': Palette,
  'Buying Guides': BookOpen,
  Gifting: Gift,
  Wholesale: Package,
  News: Newspaper,
};
export const topicIcon = (name?: string) => (name && TOPIC_ICONS[name]) || BookOpen;
export const topicHref = (name: string) => `/blog/topic/${slugify(name)}`;

/** Compact blog card: photo, topic, title and date. Used on the blog list, home page and collection pages. */
export function PostCard({ post, priority = false, headingLevel = 'h3' }: { post: BlogPost; priority?: boolean; headingLevel?: 'h2' | 'h3' }) {
  const Heading = headingLevel;
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white/70 transition hover:-translate-y-0.5 hover:border-gold-soft/60 hover:shadow-[0_14px_30px_-18px_rgb(30_31_51/0.35)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-paper">
        {post.featuredImage && (
          <Image
            src={mediaUrl(post.featuredImage)}
            alt={post.featuredImageAlt || ''}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 300px, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        {post.topic && <p className="text-[0.7rem] font-semibold tracking-[0.12em] text-gold uppercase">{post.topic}</p>}
        <Heading className="mt-1.5 line-clamp-2 font-display text-[1.05rem] leading-snug text-ink group-hover:text-gold">
          <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0">
            {post.title}
          </Link>
        </Heading>
        {post.publishedAt && (
          <p className="mt-auto flex items-center gap-1.5 pt-3 text-xs text-muted">
            <CalendarDays className="size-3.5" aria-hidden="true" />
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          </p>
        )}
      </div>
    </article>
  );
}

/** The newest post, shown large at the top of the first page. */
export function FeaturedPost({ post }: { post: BlogPost }) {
  return (
    <article className="group relative grid items-center gap-6 overflow-hidden rounded-3xl border border-line bg-white/70 p-4 sm:p-5 md:grid-cols-[1fr_1.05fr] md:gap-10 md:p-6">
      <div className="order-2 md:order-1 md:pl-2">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          <span className="rounded-full bg-paper px-2.5 py-1 font-semibold tracking-wide text-gold uppercase">Latest</span>
          {post.topic && <span className="font-semibold tracking-wide text-ink-soft uppercase">{post.topic}</span>}
          {post.publishedAt && <time dateTime={post.publishedAt}>· {formatDate(post.publishedAt)}</time>}
        </p>
        <h2 className="mt-3 font-display text-[1.45rem] leading-tight text-ink sm:text-[1.75rem]">
          <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0 group-hover:text-gold">
            {post.title}
          </Link>
        </h2>
        <p className="mt-3 line-clamp-3 text-[0.95rem] leading-relaxed text-muted">{post.excerpt}</p>
        <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-ivory transition group-hover:bg-navy-deep">
          Read the blog <ArrowRight className="size-4" />
        </span>
      </div>
      <div className="relative order-1 aspect-[16/10] overflow-hidden rounded-2xl bg-paper md:order-2">
        {post.featuredImage && (
          <Image
            src={mediaUrl(post.featuredImage)}
            alt={post.featuredImageAlt || ''}
            fill
            priority
            sizes="(min-width: 1024px) 560px, 100vw"
            className="object-cover transition duration-700 group-hover:scale-[1.03]"
          />
        )}
      </div>
    </article>
  );
}

/** Topic chips and a search box (a plain GET form, so it works without JavaScript). */
export function BlogFilterBar({ topics, active, q = '' }: { topics: BlogTopic[]; active?: string; q?: string }) {
  const chip = (on: boolean) =>
    cn(
      'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition',
      on ? 'bg-navy text-ivory' : 'text-ink-soft hover:bg-paper hover:text-ink',
    );
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white/70 p-2 md:flex-row md:items-center md:rounded-full">
      <nav aria-label="Blog topics" className="-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none] md:flex-1">
        <Link href="/blog" className={chip(!active && !q)} aria-current={!active && !q ? 'page' : undefined}>
          <LayoutGrid className="size-4" aria-hidden="true" /> All
        </Link>
        {topics.map((t) => {
          const Icon = topicIcon(t.name);
          return (
            <Link key={t.slug} href={`/blog/topic/${t.slug}`} className={chip(active === t.slug)} aria-current={active === t.slug ? 'page' : undefined}>
              <Icon className="size-4" aria-hidden="true" /> {t.name}
            </Link>
          );
        })}
      </nav>
      <form action="/blog" role="search" className="relative md:w-64">
        <label htmlFor="blog-search" className="sr-only">Search blogs</label>
        <input
          id="blog-search"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Search blogs"
          className="h-10 w-full rounded-full border border-line bg-ivory pr-10 pl-4 text-sm text-ink outline-none placeholder:text-muted focus:border-navy"
        />
        <button type="submit" aria-label="Search" className="absolute top-1/2 right-1.5 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted hover:text-ink">
          <Search className="size-4" />
        </button>
      </form>
    </div>
  );
}

export function PostGrid({ posts, empty = 'New blogs are on the way. Please check back soon.' }: { posts: BlogPost[]; empty?: string }) {
  if (!posts.length) return <p className="rounded-2xl border border-dashed border-line px-6 py-14 text-center text-muted">{empty}</p>;
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {posts.map((p, i) => <PostCard key={p._id} post={p} priority={i < 4} headingLevel="h2" />)}
    </div>
  );
}

/** Plain links so search engines can follow every page. */
export function Pagination({ basePath, page, pages, q }: { basePath: string; page: number; pages: number; q?: string }) {
  if (pages < 2) return null;
  const href = (n: number) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (n > 1) params.set('page', String(n));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const link = 'grid h-10 min-w-10 place-items-center rounded-full border px-3 text-sm transition';
  return (
    <nav aria-label="Pagination" className="mt-12 flex flex-wrap items-center justify-center gap-2">
      {page > 1 && <Link href={href(page - 1)} rel="prev" className={cn(link, 'border-line hover:border-navy')}>← Newer</Link>}
      {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
        <Link key={n} href={href(n)} aria-current={n === page ? 'page' : undefined} className={cn(link, n === page ? 'border-navy bg-navy text-ivory' : 'border-line hover:border-navy')}>
          {n}
        </Link>
      ))}
      {page < pages && <Link href={href(page + 1)} rel="next" className={cn(link, 'border-line hover:border-navy')}>Older →</Link>}
    </nav>
  );
}

export const pageParam = (v: string | string[] | undefined) => Math.max(1, Number.parseInt(String(v ?? '1'), 10) || 1);
