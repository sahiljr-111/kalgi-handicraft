import Link from 'next/link';
import { Footer } from '@/components/site/Footer';
import { Header } from '@/components/site/Header';
import { getCategories, getSettings } from '@/lib/api';

export default async function NotFound() {
  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);
  const nav = categories.map(({ _id, name, slug }) => ({ _id, name, slug }));
  return (
    <>
      <Header businessName={settings.businessName} phone={settings.phone} categories={nav} />
      <main className="mx-auto max-w-2xl px-4 py-24 text-center sm:py-32">
        <p className="font-display text-7xl text-navy italic sm:text-8xl">404</p>
        <h1 className="mt-5 text-2xl text-ink sm:mt-6 sm:text-4xl">This page has wandered off</h1>
        <p className="mt-4 text-lg text-muted">It may have moved, or the product may no longer be available. Try one of our collections instead.</p>
        <ul className="mt-10 flex flex-wrap justify-center gap-3">
          {nav.map((c) => (
            <li key={c._id}><Link href={`/${c.slug}`} className="inline-flex rounded-full border border-line px-5 py-2.5 text-ink-soft hover:border-navy hover:text-gold">{c.name}</Link></li>
          ))}
        </ul>
        <Link href="/" className="mt-10 inline-flex rounded-full bg-navy px-7 py-3.5 font-semibold text-ivory hover:bg-navy-deep">Back to home</Link>
      </main>
      <Footer settings={settings} categories={nav} />
    </>
  );
}
