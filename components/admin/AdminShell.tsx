'use client';

import { ExternalLink, FileText, FolderTree, GalleryHorizontalEnd, Home, Images, LogOut, Menu, MessageSquareText, Package, Store, UsersRound, Waypoints, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Logo } from '@/components/site/Logo';
import { api } from '@/lib/client';
import type { AdminUser } from '@/lib/types';
import { useApi } from '@/lib/useApi';
import { cn } from '@/lib/utils';
import { AdminContext } from './AdminContext';

type NavItem = { href: string; label: string; icon: typeof Home; exact?: boolean; badge?: boolean; owner?: boolean };

// Grouped by how often they're used, in plain words.
const NAV: { title: string; items: NavItem[] }[] = [
  {
    title: 'Daily work',
    items: [
      { href: '/admin', label: 'Home', icon: Home, exact: true },
      { href: '/admin/inquiries', label: 'Inquiries', icon: MessageSquareText, badge: true },
      { href: '/admin/products', label: 'Products', icon: Package },
    ],
  },
  {
    title: 'Website',
    items: [
      { href: '/admin/categories', label: 'Categories', icon: FolderTree },
      { href: '/admin/media', label: 'Photos', icon: Images },
      { href: '/admin/gallery', label: 'Work gallery', icon: GalleryHorizontalEnd },
      { href: '/admin/blog', label: 'Blogs', icon: FileText },
    ],
  },
  {
    title: 'Settings',
    items: [
      { href: '/admin/settings', label: 'Business details', icon: Store, owner: true },
      { href: '/admin/users', label: 'Staff logins', icon: UsersRound, owner: true },
      { href: '/admin/redirects', label: 'Redirects', icon: Waypoints, owner: true },
    ],
  },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  // Refresh the new-inquiry count so the badge updates without reloading.
  const { data: counts } = useApi<{ statusCounts: Record<string, number> }>('/inquiries?limit=1', { pollMs: 30_000 });
  const newCount = counts?.statusCounts?.new ?? 0;

  useEffect(() => {
    api
      .get<{ user: AdminUser }>('/auth/me')
      .then((r) => setUser(r.user))
      .catch(() => {});
  }, []);
  useEffect(() => setMobileOpen(false), [pathname]);

  async function logout() {
    await api.post('/auth/logout').catch(() => {});
    router.replace('/admin/login');
  }

  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-5 pb-4">
        <Logo onDark href="/admin" className="h-9" />
      </div>
      <nav aria-label="Dashboard" className="flex-1 overflow-y-auto px-3 pb-4">
        {NAV.map((group) => {
          const items = group.items.filter((n) => !n.owner || user?.role === 'owner');
          if (!items.length) return null;
          return (
            <div key={group.title} className="mt-4 first:mt-0">
              <p className="px-3 pb-1.5 text-xs font-semibold tracking-wide text-ivory/45 uppercase">{group.title}</p>
              <ul className="grid gap-1">
                {items.map(({ href, label, icon: Icon, exact, badge }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={isActive(href, exact) ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                        isActive(href, exact) ? 'bg-white text-navy' : 'text-ivory/85 hover:bg-white/10 hover:text-white',
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="flex-1">{label}</span>
                      {badge && newCount > 0 && (
                        <span className="rounded-full bg-gold-soft px-2 py-0.5 text-sm leading-none font-semibold text-navy" aria-label={`${newCount} new`}>
                          {newCount} new
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>
      <div className="grid gap-1 border-t border-white/10 p-4">
        <p className="px-3 pb-1 text-sm text-ivory/60">
          Signed in as <span className="font-semibold text-ivory">{user?.name || user?.email || '…'}</span>
        </p>
        <a href="/" target="_blank" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ivory/85 hover:bg-white/10 hover:text-white">
          <ExternalLink className="size-4" /> Open my website
        </a>
        <button onClick={logout} className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-ivory/85 hover:bg-white/10 hover:text-white">
          <LogOut className="size-4" /> Log out
        </button>
      </div>
    </div>
  );

  return (
    <AdminContext.Provider value={{ user }}>
      <div className="flex min-h-screen">
        <aside data-dark className="fixed inset-y-0 left-0 hidden w-64 bg-navy lg:block">
          {sidebar}
        </aside>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-stone-900/50" onClick={() => setMobileOpen(false)} />
            <aside data-dark className="absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-navy shadow-xl">
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-5 right-4 flex items-center gap-1 rounded-xl px-3 py-2 text-sm text-ivory hover:bg-white/10"
              >
                <X className="size-4" /> Close
              </button>
              {sidebar}
            </aside>
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
          <header data-dark className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 bg-navy px-4 text-ivory lg:hidden">
            <Logo onDark href="/admin" className="h-9" />
            <button onClick={() => setMobileOpen(true)} className="flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-sm font-medium hover:bg-white/10">
              <Menu className="size-4" /> Menu
            </button>
          </header>
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    </AdminContext.Provider>
  );
}
