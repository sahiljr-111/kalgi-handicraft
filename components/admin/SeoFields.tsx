import { Switch } from '@/components/ui';
import { SITE_URL } from '@/lib/utils';

/** How a page can look in Google results, built with the same code the website uses. */
export function GooglePreview({ path, title, description }: { path: string; title: string; description: string }) {
  const host = SITE_URL.replace(/^https?:\/\//, '');
  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
      <p className="mb-2 text-xs font-semibold tracking-wide text-stone-500 uppercase">How it can appear on Google</p>
      <p className="truncate text-xs text-stone-500">{host} {path.split('/').filter(Boolean).map((p) => `› ${p}`).join(' ')}</p>
      <p className="mt-0.5 truncate text-lg text-[#1a0dab]">{title}</p>
      <p className="line-clamp-2 text-sm text-stone-600">{description}</p>
      <p className={title.length > 65 ? 'mt-2 text-xs text-amber-700' : 'mt-2 text-xs text-stone-500'}>
        Title {title.length} characters{title.length > 65 ? ' (Google may cut it short)' : ''} · Description {description.length} characters
      </p>
    </div>
  );
}

/** "Hide from Google" switch: adds noindex and leaves the page out of the sitemap. */
export function NoindexSwitch({ id, checked, onChange }: { id: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-stone-200 p-4">
      <span>
        <span className="block text-sm font-semibold text-stone-900">Hide from Google</span>
        <span className="block text-sm text-stone-600">Visitors can still open it, but search engines are asked not to list it. Use only for duplicates or test pages.</span>
      </span>
      <Switch id={id} checked={checked} onChange={onChange} label="Hide from Google" />
    </label>
  );
}
