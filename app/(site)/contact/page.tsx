import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import type { Metadata } from 'next';
import { InquiryForm } from '@/components/site/InquiryForm';
import { SectionHeading } from '@/components/site/SectionHeading';
import { WhatsAppButton } from '@/components/site/WhatsAppButton';
import { getProducts, getSettings } from '@/lib/api';
import { addressLines } from '@/lib/utils';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Contact Us: Bulk Orders & Wholesale Inquiries',
  description: 'Contact Kalgi Handicraft in Jasdan, Rajkot for wholesale Meenakari chowki, dry fruit boxes and pooja articles. Call, WhatsApp or send an inquiry.',
  alternates: { canonical: '/contact' },
};

export default async function ContactPage() {
  const [s, products] = await Promise.all([getSettings(), getProducts({ limit: 200, sort: 'name' })]);
  const address = addressLines(s);
  const directions = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([s.businessName, ...address].join(', '))}`;
  return (
    <>
      <section className="site-container grid gap-8 py-5 sm:gap-12 sm:py-14 lg:grid-cols-[1fr_1.25fr] lg:gap-20 lg:py-20">
        <div>
          <SectionHeading as="h1" eyebrow="Contact" title="Let’s talk about your order" intro="Call, WhatsApp or send the form with the products and quantity you need, and we will reply with prices and availability." />
          <WhatsAppButton number={s.whatsapp} text={`Hi ${s.businessName}, I have an inquiry.`} className="mt-5 w-full py-2.5 text-sm sm:mt-8 sm:w-auto sm:py-3 sm:text-base" />
          <address className="mt-6 grid gap-4 not-italic sm:mt-10 sm:gap-6">
            {s.phone && (
              <div className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-paper text-navy sm:size-11"><Phone className="size-5" /></span>
                <div><p className="text-xs text-muted sm:text-sm">Phone</p><a href={`tel:${s.phone.replace(/\s/g, '')}`} className="inline-block py-1 font-display text-base text-ink sm:text-lg hover:text-gold sm:text-xl">{s.phone}</a></div>
              </div>
            )}
            {s.email && (
              <div className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-paper text-navy sm:size-11"><Mail className="size-5" /></span>
                <div><p className="text-xs text-muted sm:text-sm">Email</p><a href={`mailto:${s.email}`} className="inline-block py-1 font-display text-base break-all sm:text-lg text-ink hover:text-gold sm:text-xl">{s.email}</a></div>
              </div>
            )}
            {address.length > 0 && (
              <div className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-paper text-navy sm:size-11"><MapPin className="size-5" /></span>
                <div>
                  <p className="text-xs text-muted sm:text-sm">Address</p>
                  <p className="text-ink">{address.map((l) => <span key={l} className="block">{l}</span>)}</p>
                  <a href={directions} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block py-1.5 text-sm font-medium text-navy underline underline-offset-4 hover:text-gold">Get directions</a>
                </div>
              </div>
            )}
            {s.hours.length > 0 && (
              <div className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-paper text-navy sm:size-11"><Clock className="size-5" /></span>
                <div>
                  <p className="text-xs text-muted sm:text-sm">Business hours</p>
                  <dl className="mt-1 grid gap-1">
                    {s.hours.map((h) => (
                      <div key={h.days} className="flex flex-wrap gap-x-3"><dt className="text-ink">{h.days}</dt><dd className="text-muted">{h.hours}</dd></div>
                    ))}
                  </dl>
                </div>
              </div>
            )}
          </address>
        </div>
        <div className="rounded-2xl bg-paper p-4 sm:rounded-[2rem] sm:p-10">
          <h2 className="text-lg text-ink sm:text-2xl">Send an inquiry</h2>
          <p className="mt-2 mb-7 text-muted">Tell us what you are looking for and how many pieces you need.</p>
          <InquiryForm products={products.items.map(({ _id, name }) => ({ _id, name }))} />
        </div>
      </section>
      {s.mapEmbedUrl && (
        <section className="site-container">
          <iframe
            src={s.mapEmbedUrl}
            title={`Map showing ${s.businessName} in ${s.city}`}
            className="h-[300px] w-full rounded-[1.5rem] border border-line sm:h-[420px] sm:rounded-[2rem]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </section>
      )}
    </>
  );
}
