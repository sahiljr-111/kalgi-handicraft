'use client';

import { Loader2, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';
import { ApiError, api } from '@/lib/client';
import { cn } from '@/lib/utils';

interface Props {
  productId?: string;
  productName?: string;
  compact?: boolean;
  products?: { _id: string; name: string }[];
}

type Errors = Partial<Record<'name' | 'phone' | 'email' | 'quantity' | 'message' | '_form', string>>;

function normalisePhone(raw: string) {
  const d = raw.replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) return d.slice(2);
  if (d.length === 11 && d.startsWith('0')) return d.slice(1);
  return d;
}

function validate(v: Record<string, string>): Errors {
  const e: Errors = {};
  if (v.name.trim().length < 2) e.name = 'Please enter your name';
  if (!/^[6-9]\d{9}$/.test(normalisePhone(v.phone))) e.phone = 'Enter a valid 10-digit mobile number';
  if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) e.email = 'Enter a valid email';
  if (v.quantity && (!/^\d+$/.test(v.quantity) || Number(v.quantity) < 1)) e.quantity = 'Enter a number, e.g. 50';
  return e;
}

export function InquiryForm({ productId, productName, compact = false, products }: Props) {
  const router = useRouter();
  const uid = useId();
  const [values, setValues] = useState({
    name: '',
    phone: '',
    email: '',
    quantity: '',
    message: '',
    product: productId ?? '',
    website: '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const next = { ...values, [k]: e.target.value };
    setValues(next);
    if (touched[k]) setErrors(validate(next));
  };
  const blur = (k: string) => () => {
    setTouched((t) => ({ ...t, [k]: true }));
    setErrors(validate(values));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(values);
    setErrors(errs);
    setTouched({ name: true, phone: true, email: true, quantity: true });
    if (Object.keys(errs).length) {
      document.getElementById(`${uid}-${Object.keys(errs)[0]}`)?.focus();
      return;
    }
    setSubmitting(true);
    const chosen = products?.find((p) => p._id === values.product);
    try {
      await api.post('/inquiries', {
        name: values.name,
        phone: values.phone,
        email: values.email,
        quantity: values.quantity,
        message: values.message,
        productId: values.product || productId || '',
        productName: chosen?.name ?? productName ?? '',
        website: values.website,
      });
      const qs = new URLSearchParams({ name: values.name.split(' ')[0] });
      if (chosen?.name ?? productName) qs.set('product', (chosen?.name ?? productName)!);
      router.push(`/thank-you?${qs}`);
    } catch (err) {
      if (err instanceof ApiError) setErrors({ ...(err.fields as Errors), _form: err.message });
      else setErrors({ _form: 'Could not send your inquiry. Please check your connection or message us on WhatsApp.' });
      setSubmitting(false);
    }
  }

  const field = (k: 'name' | 'phone' | 'email' | 'quantity', label: string, props: React.InputHTMLAttributes<HTMLInputElement>, hint?: string) => (
    <div>
      <label htmlFor={`${uid}-${k}`} className="mb-1.5 block text-sm font-medium text-ink-soft">
        {label}
      </label>
      <input
        id={`${uid}-${k}`}
        name={k}
        value={values[k]}
        onChange={set(k)}
        onBlur={blur(k)}
        aria-invalid={Boolean(errors[k])}
        aria-describedby={errors[k] ? `${uid}-${k}-err` : hint ? `${uid}-${k}-hint` : undefined}
        className={cn(
          'w-full rounded-xl border bg-white/70 px-4 py-3 text-ink placeholder:text-muted/60 transition outline-none focus:border-navy focus:bg-white focus:ring-3 focus:ring-navy/15',
          errors[k] ? 'border-danger' : 'border-line',
        )}
        {...props}
      />
      {errors[k] ? (
        <p id={`${uid}-${k}-err`} className="mt-1.5 text-sm text-danger">{errors[k]}</p>
      ) : hint ? (
        <p id={`${uid}-${k}-hint`} className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );

  return (
    <form onSubmit={onSubmit} noValidate data-cta-zone className="grid gap-4">
      <div className={cn('grid gap-4', !compact && 'sm:grid-cols-2')}>
        {field('name', 'Your name *', { autoComplete: 'name', placeholder: 'e.g. Rakesh Shah' })}
        {field('phone', 'Mobile number *', { type: 'tel', inputMode: 'tel', autoComplete: 'tel', placeholder: '98765 43210' }, 'We reply on WhatsApp or by call')}
        {field('email', 'Email (optional)', { type: 'email', autoComplete: 'email', placeholder: 'you@company.com' })}
        {field('quantity', 'Quantity', { inputMode: 'numeric', placeholder: 'e.g. 1, 10 or 500' }, 'Any quantity, from one piece')}
      </div>

      {products && (
        <div>
          <label htmlFor={`${uid}-product`} className="mb-1.5 block text-sm font-medium text-ink-soft">Product (optional)</label>
          <select
            id={`${uid}-product`}
            value={values.product}
            onChange={set('product')}
            className="w-full rounded-xl border border-line bg-white/70 px-4 py-3 text-ink outline-none focus:border-navy focus:ring-3 focus:ring-navy/15"
          >
            <option value="">General inquiry</option>
            {products.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor={`${uid}-message`} className="mb-1.5 block text-sm font-medium text-ink-soft">Message</label>
        <textarea
          id={`${uid}-message`}
          rows={compact ? 3 : 4}
          value={values.message}
          onChange={set('message')}
          placeholder="Colours, custom sizes, branding, delivery city…"
          className="w-full resize-y rounded-xl border border-line bg-white/70 px-4 py-3 text-ink placeholder:text-muted/60 outline-none focus:border-navy focus:bg-white focus:ring-3 focus:ring-navy/15"
        />
      </div>

      {/* Honeypot: hidden from people, tempting to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website <input tabIndex={-1} autoComplete="off" value={values.website} onChange={set('website')} />
        </label>
      </div>

      {errors._form && (
        <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{errors._form}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-navy px-6 py-3.5 font-semibold text-ivory transition hover:bg-navy-deep active:scale-[0.99] disabled:opacity-70"
      >
        {submitting ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-4" />}
        {submitting ? 'Sending…' : 'Send inquiry'}
      </button>
      <p className="text-xs text-muted">We usually reply within a few hours on working days. Your details are only used to answer your inquiry.</p>
    </form>
  );
}
