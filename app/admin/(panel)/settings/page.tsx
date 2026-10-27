'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ImageField } from '@/components/admin/MediaPicker';
import { Button, Card, CardHeader, Field, Input, PageHeader, Skeleton, Textarea } from '@/components/ui';
import { ApiError, api } from '@/lib/client';
import type { Settings } from '@/lib/types';
import { useApi } from '@/lib/useApi';

function PasswordCard() {
  const [v, setV] = useState({ currentPassword: '', newPassword: '' });
  const [saving, setSaving] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/auth/password', v);
      toast.success('Password changed');
      setV({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <Card>
      <CardHeader title="Change your password" description="Use at least 8 letters or numbers. Write it down somewhere safe." />
      <form onSubmit={save} className="grid gap-4 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label="Current password" htmlFor="pw-cur"><Input id="pw-cur" type="password" autoComplete="current-password" value={v.currentPassword} onChange={(e) => setV({ ...v, currentPassword: e.target.value })} /></Field>
        <Field label="New password" htmlFor="pw-new"><Input id="pw-new" type="password" autoComplete="new-password" minLength={8} value={v.newPassword} onChange={(e) => setV({ ...v, newPassword: e.target.value })} /></Field>
        <Button type="submit" variant="outline" loading={saving} disabled={!v.currentPassword || v.newPassword.length < 8}>Change password</Button>
      </form>
    </Card>
  );
}

export default function SettingsPage() {
  const { data } = useApi<Settings>('/settings');
  const [v, setV] = useState<Settings | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (data) setV(data); }, [data]);

  if (!v) return <div className="grid gap-4"><Skeleton className="h-8 w-40" /><Skeleton className="h-96" /></div>;

  const set = (patch: Partial<Settings>) => setV((x) => (x ? { ...x, ...patch } : x));
  const text = (k: keyof Settings, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, hint?: string) => (
    <Field label={label} htmlFor={`s-${k}`} error={errors[k]} hint={hint}>
      <Input id={`s-${k}`} value={String(v[k] ?? '')} onChange={(e) => set({ [k]: e.target.value } as Partial<Settings>)} invalid={Boolean(errors[k])} {...props} />
    </Field>
  );

  async function save() {
    setSaving(true);
    setErrors({});
    try {
      const saved = await api.put<Settings>('/settings', v);
      setV(saved);
      toast.success('Saved. Your website will show the new details in a few seconds.');
    } catch (e) {
      if (e instanceof ApiError) setErrors(e.fields);
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl pb-24">
    <form onSubmit={(e) => { e.preventDefault(); void save(); }}>
      <PageHeader title="Business details" description="Change these whenever your phone number, address or hours change. Press “Save changes” at the bottom when you are done." />
      <div className="grid gap-4">
        <Card>
          <CardHeader title="Phone and address" description="Shown on every page of your website and on the Contact page." />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            {text('phone', 'Phone number', { type: 'tel' }, 'Written the way customers should see it, e.g. +91 84698 85085')}
            {text('whatsapp', 'WhatsApp number', { inputMode: 'numeric' }, 'Start with 91, then the 10-digit number, e.g. 918469885085')}
            {text('email', 'Email', { type: 'email' }, 'New inquiries are also sent to this email.')}
            {text('mapEmbedUrl', 'Google Maps link (optional)', {}, 'Ask your developer if you want to change the map.')}
            <div className="sm:col-span-2">{text('addressLine', 'Street address')}</div>
            {text('city', 'Town and district')}
            {text('state', 'State')}
            {text('postalCode', 'PIN code', { inputMode: 'numeric' })}
          </div>
        </Card>
        <Card>
          <CardHeader title="About your business" description="Used in the footer and in Google search results." />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            {text('businessName', 'Business name')}
            {text('ownerName', 'Owner name')}
            <div className="sm:col-span-2">{text('tagline', 'One line about your business')}</div>
            {text('gstNumber', 'GST number')}
            {text('establishedYear', 'Year you started', { inputMode: 'numeric' })}
            {text('rating', 'Your rating (out of 5)', { inputMode: 'decimal' }, 'Copy it exactly from IndiaMART or Google, like 4.5')}
            {text('ratingCount', 'Number of ratings', { inputMode: 'numeric' }, 'The real count shown on that site')}
            {text('ratingSource', 'Where the rating is from', {}, 'For example IndiaMART')}
            {text('ratingUrl', 'Link to the ratings page', { inputMode: 'url' }, 'Visitors can click it to check the rating')}
          </div>
        </Card>
        <Card>
          <CardHeader title="Opening hours" description="For example “Monday – Saturday” and “9:30 AM – 7:30 PM”." action={<Button type="button" size="sm" variant="outline" onClick={() => set({ hours: [...v.hours, { days: '', hours: '' }] })}><Plus className="size-4" /> Add a line</Button>} />
          <div className="grid gap-3 p-5">
            {v.hours.map((h, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-3">
                <Input aria-label="Days" value={h.days} placeholder="Monday – Saturday" onChange={(e) => set({ hours: v.hours.map((x, j) => (j === i ? { ...x, days: e.target.value } : x)) })} />
                <Input aria-label="Hours" value={h.hours} placeholder="9:30 AM – 7:30 PM" onChange={(e) => set({ hours: v.hours.map((x, j) => (j === i ? { ...x, hours: e.target.value } : x)) })} />
                <Button type="button" variant="ghost" size="sm" onClick={() => set({ hours: v.hours.filter((_, j) => j !== i) })} className="text-red-700 hover:bg-red-50"><Trash2 className="size-4" /> Remove</Button>
              </div>
            ))}
            {!v.hours.length && <p className="text-sm text-stone-500">No hours added.</p>}
          </div>
        </Card>
        <Card>
          <CardHeader title="Customer reviews" description="Only add real reviews, with the customer’s permission. Shown on the home page." action={<Button type="button" size="sm" variant="outline" onClick={() => set({ testimonials: [...v.testimonials, { name: '', location: '', quote: '', rating: 5 }] })}><Plus className="size-4" /> Add</Button>} />
          <div className="grid gap-4 p-5">
            {v.testimonials.map((t, i) => {
              const upd = (p: Partial<typeof t>) => set({ testimonials: v.testimonials.map((x, j) => (j === i ? { ...x, ...p } : x)) });
              return (
                <div key={i} className="grid gap-3 rounded-lg border border-stone-200 p-4 sm:grid-cols-[1fr_1fr_100px_auto]">
                  <Input aria-label="Customer name" placeholder="Customer name" value={t.name} onChange={(e) => upd({ name: e.target.value })} />
                  <Input aria-label="City" placeholder="City" value={t.location} onChange={(e) => upd({ location: e.target.value })} />
                  <Input aria-label="Rating" type="number" min={1} max={5} value={t.rating} onChange={(e) => upd({ rating: Number(e.target.value) })} />
                  <Button type="button" variant="ghost" size="sm" onClick={() => set({ testimonials: v.testimonials.filter((_, j) => j !== i) })} className="text-red-700 hover:bg-red-50"><Trash2 className="size-4" /> Remove</Button>
                  <Textarea aria-label="Quote" rows={2} placeholder="What they said" value={t.quote} onChange={(e) => upd({ quote: e.target.value })} className="sm:col-span-4" />
                </div>
              );
            })}
          </div>
        </Card>
        <Card>
          <CardHeader title="Website photos and links" description="The big photos on the home page and About page, and your pages on other websites." />
          <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
            <ImageField value={v.heroImage} onChange={(heroImage) => set({ heroImage })} label="Home page photo" aspect="aspect-[4/5]" />
            <ImageField value={v.aboutImage} onChange={(aboutImage) => set({ aboutImage })} label="About page photo" aspect="aspect-[4/5]" />
            <div className="grid content-start gap-4 sm:col-span-2">
              {(['indiamart', 'instagram', 'facebook', 'youtube'] as const).map((k) => (
                <Field key={k} label={k === 'indiamart' ? 'IndiaMART page' : k[0].toUpperCase() + k.slice(1)} htmlFor={`soc-${k}`}>
                  <Input id={`soc-${k}`} type="url" placeholder="https://" value={v.social[k]} onChange={(e) => set({ social: { ...v.social, [k]: e.target.value } })} />
                </Field>
              ))}
            </div>
          </div>
        </Card>
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 backdrop-blur lg:left-64">
          <div className="mx-auto flex max-w-6xl justify-end px-4 py-4 sm:px-5 lg:px-10">
            <Button type="submit" size="lg" loading={saving}>Save changes</Button>
          </div>
        </div>
      </div>
    </form>
    <div className="mt-6"><PasswordCard /></div>
    </div>
  );
}
