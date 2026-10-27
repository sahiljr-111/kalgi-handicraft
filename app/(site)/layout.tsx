import Script from 'next/script';
import { Footer } from '@/components/site/Footer';
import { Header } from '@/components/site/Header';
import { JsonLd } from '@/components/site/JsonLd';
import { WhatsAppFab } from '@/components/site/WhatsAppButton';
import { getCategories, getGallery, getSettings } from '@/lib/api';
import { localBusinessSchema, websiteSchema } from '@/lib/seo';

// Google Analytics 4 (public website only, never the dashboard)
const GA_ID = process.env.NEXT_PUBLIC_GA_ID?.replace(/[^A-Z0-9-]/gi, '');

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories, gallery] = await Promise.all([getSettings(), getCategories(), getGallery()]);
  const nav = categories.map(({ _id, name, slug }) => ({ _id, name, slug }));
  return (
    <>
      <a href="#main" className="sr-only z-[70] rounded-full bg-ink px-4 py-2 text-ivory focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Skip to content
      </a>
      <Header businessName={settings.businessName} phone={settings.phone} categories={nav} showGallery={gallery.length > 0} />
      <main id="main">{children}</main>
      <Footer settings={settings} categories={nav} showGallery={gallery.length > 0} />
      <WhatsAppFab number={settings.whatsapp} businessName={settings.businessName} />
      <JsonLd data={localBusinessSchema(settings)} />
      <JsonLd data={websiteSchema(settings)} />
      {GA_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
          </Script>
        </>
      )}
    </>
  );
}
