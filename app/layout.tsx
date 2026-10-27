import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { SITE_URL } from '@/lib/utils';
import './globals.css';

// Self-hosted (SIL Open Font License) so builds never depend on reaching Google Fonts.
const fraunces = localFont({
  src: [
    { path: './fonts/fraunces-latin-wght-normal.woff2', style: 'normal' },
    { path: './fonts/fraunces-latin-wght-italic.woff2', style: 'italic' },
  ],
  weight: '100 900',
  variable: '--font-fraunces',
  display: 'swap',
});
const instrument = localFont({
  src: './fonts/instrument-sans-latin-wght-normal.woff2',
  weight: '400 700',
  variable: '--font-instrument',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Kalgi Handicraft | Meenakari Chowki & Dry Fruit Box Maker',
    template: '%s | Kalgi Handicraft',
  },
  description:
    'Manufacturer of Meenakari wooden chowki, bajot, dry fruit boxes and pooja articles in Jasdan, Gujarat, since 1999. Wholesale and bulk orders.',
  applicationName: 'Kalgi Handicraft',
  keywords: [
    'wooden chowki manufacturer Gujarat',
    'meenakari dry fruit box wholesale',
    'pooja bajot online India',
    'handicraft jewellery box manufacturer Rajkot',
    'meenakari chowki',
    'pooja thali set',
    'Kalgi Handicraft Jasdan',
  ],
  // NEXT_PUBLIC_NOINDEX=true keeps a demo/staging copy out of Google.
  robots: process.env.NEXT_PUBLIC_NOINDEX === 'true'
    ? { index: false, follow: false }
    : { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } : undefined,
  openGraph: { type: 'website', siteName: 'Kalgi Handicraft', locale: 'en_IN' },
  twitter: { card: 'summary_large_image' },
  icons: { icon: '/icon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#1e1f33',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${fraunces.variable} ${instrument.variable}`}>
      <body>{children}</body>
    </html>
  );
}
