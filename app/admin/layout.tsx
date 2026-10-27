import type { Metadata } from 'next';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: { default: 'Dashboard', template: '%s · Kalgi Admin' },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin min-h-screen">
      {children}
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
