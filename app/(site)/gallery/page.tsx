import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { GalleryGrid } from '@/components/site/GalleryGrid';
import { SectionHeading } from '@/components/site/SectionHeading';
import { getGallery } from '@/lib/api';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Gallery: Our Work',
  description: 'Photos of work and orders from Kalgi Handicraft, a Meenakari woodcraft manufacturer in Jasdan, Gujarat.',
  alternates: { canonical: '/gallery' },
};

export default async function GalleryPage() {
  const items = await getGallery();
  // Hidden (404, out of the menu and sitemap) until real photos are added in Admin → Work gallery.
  if (!items.length) notFound();
  return (
    <section className="site-container py-14 lg:py-20">
      <SectionHeading as="h1" eyebrow="Gallery" title="Our work" intro="Photos from our unit and of orders we have made." align="center" className="mb-12" />
      <GalleryGrid items={items} />
    </section>
  );
}
