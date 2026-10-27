import type { Metadata } from 'next';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/site/Breadcrumbs';
import { CategoryBrowser } from '@/components/site/CategoryBrowser';
import { JsonLd } from '@/components/site/JsonLd';
import { WhatsAppButton } from '@/components/site/WhatsAppButton';
import { PostCard } from '@/components/site/BlogIndex';
import { getBlogPosts, getCategories, getCategory, getProducts, getSettings, redirectOrNotFound } from '@/lib/api';
import { absoluteUrl, categorySchema, categorySeoDescription, categorySeoTitle } from '@/lib/seo';
import type { CategoryRef, Product } from '@/lib/types';
import { formatPrice, mediaUrl, paragraphs } from '@/lib/utils';

export const revalidate = 3600;
export const dynamicParams = true;

type Props = { params: Promise<{ category: string }> };

/** Facts computed from the live product list, so they never go stale. */
function quickFacts(items: Product[]) {
  if (!items.length) return [];
  const prices = items.map((p) => p.priceFrom).filter((n) => n > 0);
  const materials = [...new Set(items.map((p) => p.material.split(',')[0].trim()).filter(Boolean))];
  const range = (a: number[], fmt: (n: number) => string) => (Math.min(...a) === Math.max(...a) ? fmt(a[0]) : `${fmt(Math.min(...a))} to ${fmt(Math.max(...a))}`);
  return [
    ['Designs', String(items.length)],
    ...(prices.length ? [['Starting prices', range(prices, formatPrice)]] : []),
    ['Order', 'Any quantity'],
    ...(materials.length ? [['Materials', materials.slice(0, 4).join(', ')]] : []),
  ] as [string, string][];
}

export async function generateStaticParams() {
  return (await getCategories()).map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).category;
  const [category, settings, products] = await Promise.all([getCategory(slug), getSettings(), getProducts({ category: slug, limit: 200 })]);
  if (!category) return {};
  const title = categorySeoTitle(category, settings);
  const description = categorySeoDescription(category, settings, products.total);
  const image = category.image ? absoluteUrl(category.image) : undefined;
  return {
    title: { absolute: title },
    description,
    keywords: [`${category.name} manufacturer`, `${category.name} wholesale`, `${category.name} ${settings.state || 'Gujarat'}`, `meenakari ${category.name.toLowerCase()}`, settings.businessName],
    alternates: { canonical: `/${category.slug}` },
    robots: category.noindex ? { index: false, follow: true } : undefined,
    openGraph: { type: 'website', title, description, url: `/${category.slug}`, images: image ? [{ url: image, alt: category.name }] : undefined },
    twitter: { card: 'summary_large_image', title, description, images: image ? [image] : undefined },
  };
}

export default async function CategoryPage({ params }: Props) {
  const slug = (await params).category;
  const [category, settings] = await Promise.all([getCategory(slug), getSettings()]);
  if (!category) return redirectOrNotFound(`/${slug}`);
  const [{ items }, posts] = await Promise.all([getProducts({ category: category.slug, limit: 200 }), getBlogPosts(50)]);
  const facts = quickFacts(items);
  const guides = posts.filter((p) => (p.relatedCategory as CategoryRef | null)?.slug === category.slug).slice(0, 3);

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-line bg-paper">
        <div aria-hidden="true" className="pattern-buta absolute inset-0 -z-10 [mask-image:linear-gradient(to_left,black,transparent_70%)]" />
        <div className="site-container grid items-center gap-8 py-8 sm:py-10 md:grid-cols-[1fr_auto] lg:py-14">
          <div>
            <Breadcrumbs items={[{ name: category.name, href: `/${category.slug}` }]} />
            <h1 className="mt-4 text-[2rem] leading-tight text-ink sm:mt-5 sm:text-4xl lg:text-5xl">{category.name}</h1>
            {category.tagline && <p className="mt-3 max-w-2xl text-base text-muted sm:mt-4 sm:text-lg">{category.tagline}</p>}
            {facts.length > 0 && (
              <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                {facts.map(([k, v]) => (
                  <div key={k} className="flex gap-1.5">
                    <dt className="text-muted">{k}:</dt>
                    <dd className="font-medium text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
          {category.image && (
            <div className="arch arch-ring relative hidden aspect-[3/4] w-44 bg-ivory md:block lg:w-52">
              <Image src={mediaUrl(category.image)} alt="" fill sizes="208px" className="object-cover" priority />
            </div>
          )}
        </div>
      </section>

      <section className="site-container py-8 sm:py-12">
        <CategoryBrowser products={items} />
      </section>

      {category.description && (
        <section className="site-container">
          <div className="grid gap-8 rounded-[1.5rem] border border-line bg-white/40 p-5 sm:gap-10 sm:rounded-[2rem] sm:p-12 lg:grid-cols-[1fr_320px]">
            <div className="prose-kalgi max-w-3xl">
              <h2 className="!mt-0">About our {category.name.toLowerCase()}</h2>
              {paragraphs(category.description).map((p, i) => <p key={i}>{p}</p>)}
            </div>
            <aside className="self-start rounded-3xl bg-navy p-7 text-ivory">
              <p className="font-display text-xl sm:text-2xl">Buying in bulk?</p>
              <p className="mt-2 text-sm text-ivory/75">Send the design, quantity and delivery city, and we will reply with a quote and photos.</p>
              <WhatsAppButton number={settings.whatsapp} text={`Hi ${settings.businessName}, I'm looking for ${category.name} in bulk.`} className="mt-5 w-full" />
            </aside>
          </div>
        </section>
      )}

      {guides.length > 0 && (
        <section className="site-container pt-14 sm:pt-20">
          <h2 className="text-2xl text-ink sm:text-3xl">Buying guides</h2>
          <div className="mt-8 grid gap-x-8 gap-y-12 md:grid-cols-3">
            {guides.map((p) => <PostCard key={p._id} post={p} />)}
          </div>
        </section>
      )}

      <JsonLd data={categorySchema(category, items, settings)} />
    </>
  );
}
