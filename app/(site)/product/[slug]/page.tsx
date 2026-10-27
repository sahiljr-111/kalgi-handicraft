import { Check, Package, Palette, Ruler, TreePine } from 'lucide-react';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/site/Breadcrumbs';
import { InquiryForm } from '@/components/site/InquiryForm';
import { JsonLd } from '@/components/site/JsonLd';
import { ProductCard } from '@/components/site/ProductCard';
import { ProductGallery } from '@/components/site/ProductGallery';
import { WhatsAppButton } from '@/components/site/WhatsAppButton';
import { getProduct, getProducts, getSettings, redirectOrNotFound } from '@/lib/api';
import { productSchema, productSeoDescription, productSeoTitle } from '@/lib/seo';
import { formatPrice, paragraphs, productWhatsappText } from '@/lib/utils';

export const revalidate = 3600;
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getProducts({ limit: 200 })).items.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [product, settings] = await Promise.all([getProduct((await params).slug), getSettings()]);
  if (!product) return {};
  const title = productSeoTitle(product, settings);
  const description = productSeoDescription(product, settings);
  return {
    title: { absolute: title },
    description,
    keywords: [product.name, product.category?.name, `${product.category?.name} manufacturer`, product.material, `${product.name} wholesale`, settings.businessName].filter(Boolean) as string[],
    alternates: { canonical: `/product/${product.slug}` },
    robots: product.noindex ? { index: false, follow: true } : undefined,
    // The branded share image comes from ./opengraph-image.tsx
    openGraph: { type: 'website', title, description, url: `/product/${product.slug}` },
    twitter: { card: 'summary_large_image', title, description },
    other: product.priceFrom > 0 ? { 'product:price:amount': String(product.priceFrom), 'product:price:currency': 'INR' } : undefined,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getProduct(slug), getSettings()]);
  if (!product) return redirectOrNotFound(`/product/${slug}`);

  const specs = [
    { icon: TreePine, label: 'Material', value: product.material },
    { icon: Ruler, label: 'Size', value: product.size },
    { icon: Palette, label: 'Colours', value: product.colorOptions.join(', ') },
    { icon: Package, label: 'Order quantity', value: 'Any quantity, from one piece' },
  ].filter((s) => s.value);

  return (
    <>
      <div className="site-container pt-8">
        <Breadcrumbs
          items={[
            ...(product.category ? [{ name: product.category.name, href: `/${product.category.slug}` }] : []),
            { name: product.name, href: `/product/${product.slug}` },
          ]}
        />
      </div>

      <section className="site-container grid gap-10 py-8 lg:grid-cols-2 lg:gap-16 lg:py-12">
        <ProductGallery images={product.images} name={product.name} />

        <div>
          <p className="eyebrow">{product.category?.name}</p>
          <h1 className="mt-2 text-[1.7rem] leading-tight text-ink sm:mt-3 sm:text-3xl lg:text-[2.6rem]">{product.name}</h1>
          <p className="mt-4 flex flex-wrap items-baseline gap-x-2 sm:mt-5">
            {product.priceFrom > 0 ? (
              <>
                <span className="text-sm text-muted">Starting at</span>
                <span className="font-display text-2xl text-navy sm:text-3xl">{formatPrice(product.priceFrom)}</span>
                <span className="text-muted">{product.unit}</span>
              </>
            ) : (
              <span className="font-display text-2xl text-navy sm:text-3xl">Price on request</span>
            )}
          </p>
          <p className="mt-1 text-sm text-muted">Wholesale prices on bulk quantities.</p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <WhatsAppButton number={settings.whatsapp} text={productWhatsappText(product.name, product.slug)} productSlug={product.slug} className="flex-1" />
            <a href="#inquiry" className="inline-flex flex-1 items-center justify-center rounded-full border border-ink/20 px-6 py-3 font-semibold text-ink transition hover:border-navy hover:text-gold">
              Request a quote
            </a>
          </div>

          <dl className="mt-7 divide-y sm:mt-9 divide-line overflow-hidden rounded-2xl border border-line bg-white/50">
            {specs.map(({ icon: Icon, label, value }) => (
              <div key={label} className="grid grid-cols-[auto_100px_1fr] items-start gap-3 px-4 py-3 text-[0.8125rem] sm:grid-cols-[auto_150px_1fr] sm:px-5 sm:py-4 sm:text-sm">
                <Icon className="mt-0.5 size-4 text-gold" aria-hidden="true" />
                <dt className="font-medium text-ink-soft">{label}</dt>
                <dd className="text-ink">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="prose-kalgi mt-7 sm:mt-9">
            {paragraphs(product.description).map((p, i) => <p key={i}>{p}</p>)}
          </div>

          {/* Only facts the business has verified (see docs/SEO-AUDIT.md). */}
          <ul className="mt-8 grid gap-2.5 text-sm text-ink-soft">
            {[
              `Made by ${settings.businessName}, a manufacturer in ${(settings.city || 'Jasdan').split(',')[0]}, ${settings.state || 'Gujarat'}${settings.establishedYear ? ` since ${settings.establishedYear}` : ''}`,
              settings.gstNumber ? `GST-registered business (GSTIN ${settings.gstNumber})` : '',
              'Ask on WhatsApp for current photos, stock and the price for your quantity',
            ]
              .filter(Boolean)
              .map((t) => (
                <li key={t} className="flex gap-2.5"><Check className="size-4 shrink-0 text-emerald" />{t}</li>
              ))}
          </ul>
        </div>
      </section>

      <section id="inquiry" className="site-container scroll-mt-28 py-10">
        <div className="grid gap-8 rounded-[1.5rem] bg-paper p-5 sm:gap-10 sm:rounded-[2rem] sm:p-10 lg:grid-cols-[1fr_1.4fr] lg:p-14">
          <div>
            <p className="eyebrow">Inquiry</p>
            <h2 className="mt-2 text-2xl leading-tight text-ink sm:mt-3 sm:text-3xl">Get a quote for {product.name}</h2>
            <p className="mt-3 text-sm text-muted sm:mt-4 sm:text-base">Tell us the quantity you need and where it should be delivered. We will reply with pricing and availability.</p>
          </div>
          <InquiryForm productId={product._id} productName={product.name} />
        </div>
      </section>

      {product.related.length > 0 && (
        <section className="site-container pt-14">
          <h2 className="text-2xl text-ink sm:text-3xl">You may also like</h2>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:mt-10 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-4">
            {product.related.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      )}

      <JsonLd data={productSchema(product, settings)} />
    </>
  );
}
