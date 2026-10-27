import { CheckCircle2 } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { WhatsAppButton } from '@/components/site/WhatsAppButton';
import { getSettings } from '@/lib/api';

export const metadata: Metadata = { title: 'Thank you', robots: { index: false } };

export default async function ThankYouPage({ searchParams }: { searchParams: Promise<{ name?: string; product?: string }> }) {
  const [{ name, product }, s] = await Promise.all([searchParams, getSettings()]);
  return (
    <section className="mx-auto max-w-2xl px-4 py-20 text-center sm:py-28">
      <span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-soft text-emerald"><CheckCircle2 className="size-8" /></span>
      <h1 className="mt-6 text-3xl text-ink sm:mt-8 sm:text-4xl lg:text-5xl">Thank you{name ? `, ${name.slice(0, 40)}` : ''}!</h1>
      <p className="mt-4 text-base text-muted sm:mt-5 sm:text-lg">
        We have received your inquiry{product ? <> about <strong className="text-ink">{product.slice(0, 120)}</strong></> : ''}. Our team will call or WhatsApp you within a few working hours.
      </p>
      <div className="meena-band-thin mx-auto my-10 w-40" />
      <p className="text-muted">In a hurry? Message us directly:</p>
      <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
        <WhatsAppButton number={s.whatsapp} text={`Hi ${s.businessName}, I just sent an inquiry${product ? ` about ${product}` : ''}.`}>Continue on WhatsApp</WhatsAppButton>
        <Link href="/" className="inline-flex items-center justify-center rounded-full border border-ink/20 px-6 py-3 font-semibold text-ink hover:border-navy hover:text-gold">Back to home</Link>
      </div>
    </section>
  );
}
