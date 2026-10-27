import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BlogFilterBar, FeaturedPost, Pagination, PostGrid, pageParam } from '@/components/site/BlogIndex';
import { Breadcrumbs } from '@/components/site/Breadcrumbs';
import { getBlogPage, getBlogTopics } from '@/lib/api';

export const revalidate = 3600;

type Props = { searchParams: Promise<{ page?: string; q?: string }> };

const PER_PAGE = 12;

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { page: p, q } = await searchParams;
  const page = pageParam(p);
  const suffix = page > 1 ? ` (Page ${page})` : '';
  return {
    title: `Blogs: Meenakari, Pooja Décor & Gifting Guides${suffix}`,
    description: 'Practical guides on Meenakari work, pooja chowkis and thalis, dry fruit boxes for gifting, and buying handicrafts wholesale from a manufacturer.',
    alternates: { canonical: page > 1 ? `/blog?page=${page}` : '/blog' },
    // Search results are not separate pages for Google.
    robots: q ? { index: false, follow: true } : undefined,
  };
}

export default async function BlogPage({ searchParams }: Props) {
  const { page: p, q: rawQ } = await searchParams;
  const page = pageParam(p);
  const q = (rawQ ?? '').trim().slice(0, 80);
  const [{ items, pages, total }, topics] = await Promise.all([getBlogPage({ page, limit: PER_PAGE, q }), getBlogTopics()]);
  if (page > 1 && !items.length) notFound();
  // Page 1 without a search shows the newest post large, then the rest in the grid.
  const [featured, ...rest] = !q && page === 1 ? items : [null, ...items];

  return (
    <section className="site-container py-8 lg:py-12">
      <Breadcrumbs items={[{ name: 'Blogs', href: '/blog' }]} />
      <div className="mt-5 max-w-2xl">
        <h1 className="text-[1.9rem] leading-tight text-ink sm:text-4xl">Blogs</h1>
        <p className="mt-2 text-[0.95rem] text-muted sm:text-base">
          Simple guides on Meenakari work, choosing a chowki or thali, gifting with dry fruit boxes and buying in bulk.
        </p>
      </div>

      {featured && (
        <div className="mt-8">
          <FeaturedPost post={featured} />
        </div>
      )}

      <div className="mt-8">
        <BlogFilterBar topics={topics} q={q} />
      </div>

      {q && (
        <p className="mt-6 text-sm text-muted">
          {total} {total === 1 ? 'result' : 'results'} for <span className="font-semibold text-ink">“{q}”</span>
        </p>
      )}

      <div className="mt-6">
        <PostGrid posts={rest as typeof items} empty={q ? 'No blogs match your search. Try another word.' : undefined} />
      </div>
      <Pagination basePath="/blog" page={page} pages={pages} q={q} />
    </section>
  );
}
