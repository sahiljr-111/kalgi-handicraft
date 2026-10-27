'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Logo } from '@/components/site/Logo';
import { Button, Field, Input } from '@/components/ui';
import { ApiError, api } from '@/lib/client';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/login', { email, password });
      const next = params.get('next');
      router.replace(next && next.startsWith('/admin') ? next : '/admin');
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not connect. Please check your internet and try again.');
      setLoading(false);
    }
  }

  const expired = params.get('reason') === 'expired';

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      {expired && !error && (
        <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Your session has ended. Please sign in again.</p>
      )}
      <Field label="Email" htmlFor="email">
        <Input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
      </Field>
      <Field label="Password" htmlFor="password">
        <div className="relative">
          <Input id="password" type={show ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10" />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute top-1/2 right-2 grid size-5 -translate-y-1/2 place-items-center rounded text-stone-500 hover:text-stone-800" aria-label={show ? 'Hide password' : 'Show password'}>
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </Field>
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <Button type="submit" size="lg" loading={loading} className="mt-2 w-full">Sign in</Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div data-dark className="relative hidden overflow-hidden bg-navy lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="jaal absolute inset-0 opacity-70" aria-hidden="true" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_80%_20%,rgb(193_162_95/0.18),transparent_70%)]" aria-hidden="true" />
        <div className="meena-band absolute inset-x-0 top-0" />
        <Logo onDark href={null} className="relative h-16 self-start" />
        <div className="relative">
          <p className="font-display text-4xl leading-tight text-ivory">Manage your catalogue, inquiries and website from one place.</p>
          <p className="mt-4 text-gold-soft/80">Kalgi Handicraft · Jasdan, Gujarat</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <Logo href={null} className="h-9 lg:hidden" />
          <h1 className="mt-6 text-2xl font-semibold text-stone-900 lg:mt-0">Sign in to your dashboard</h1>
          <p className="mt-2 mb-6 text-sm text-stone-600">Type your email and password, then press “Sign in”.</p>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
