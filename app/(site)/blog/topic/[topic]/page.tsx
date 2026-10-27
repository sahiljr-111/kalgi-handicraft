import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BlogFilterBar, Pagination, PostGrid, pageParam } from '@/components/site/BlogIndex';
import { Breadcrumbs } from '@/components/site/Breadcrumbs';
import { getBlogPage, getBlogTopics } from '@/lib/api';

export const revalidate = 3600;

type Props = { params: Promise<{ topic: string }>; searchParams: Promise<{ page?: string }> };

const PER_PAGE = 12;

async function findTopic(slug: string) {
  return (await getBlogTopics()).find((t) => t.slug === slug) ?? null;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ topic: slug }, { page: p }] = await Promise.all([params, searchParams]);
  const topic = await findTopic(slug);
  if (!topic) return {};
  const page = pageParam(p);
  const path = `/blog/topic/${topic.slug}`;
  return {
    title: `${topic.name} – Blogs${page > 1 ? ` (Page ${page})` : ''}`,
    description: `Blogs on ${topic.name.toLowerCase()} from Kalgi Handicraft, a Meenakari woodcraft manufacturer in Jasdan, Gujarat.`,
    alternates: { canonical: page > 1 ? `${path}?page=${page}` : path },
  };
}

export default async function BlogTopicPage({ params, searchParams }: Props) {
  const [{ topic: slug }, { page: p }] = await Promise.all([params, searchParams]);
  const page = pageParam(p);
  const [topics, topic] = await Promise.all([getBlogTopics(), findTopic(slug)]);
  if (!topic) notFound();
  const { items, pages } = await getBlogPage({ page, limit: PER_PAGE, topic: topic.name });
  if (!items.length) notFound();
  const path = `/blog/topic/${topic.slug}`;
  return (
    <section className="site-container py-8 lg:py-12">
      <Breadcrumbs items={[{ name: 'Blogs', href: '/blog' }, { name: topic.name, href: path }]} />
      <div className="mt-5 max-w-2xl">
        <h1 className="text-[1.9rem] leading-tight text-ink sm:text-4xl">{topic.name}</h1>
        <p className="mt-2 text-[0.95rem] text-muted sm:text-base">
          {topic.count} {topic.count === 1 ? 'blog' : 'blogs'} on this topic.
        </p>
      </div>
      <div className="mt-8">
        <BlogFilterBar topics={topics} active={topic.slug} />
      </div>
      <div className="mt-6">
        <PostGrid posts={items} />
      </div>
      <Pagination basePath={path} page={page} pages={pages} />
    </section>
  );
}
