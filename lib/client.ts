'use client';

/** Browser-side API client. Requests go through the Next.js /api rewrite, so the auth cookie is first-party. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields: Record<string, string> = {},
  ) {
    super(message);
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'same-origin',
    headers: body && !isForm ? { 'Content-Type': 'application/json' } : undefined,
    body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const { pathname } = typeof window !== 'undefined' ? window.location : { pathname: '' };
    if (res.status === 401 && pathname.startsWith('/admin') && pathname !== '/admin/login' && !path.startsWith('/auth/login')) {
      // The API has already cleared the session cookie, so the login page won't bounce back.
      window.location.replace(`/admin/login?reason=expired&next=${encodeURIComponent(pathname)}`);
    }
    throw new ApiError(res.status, data.error ?? 'Request failed', data.fields ?? data.details?.fields ?? {});
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body ?? {}),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body ?? {}),
  del: <T>(path: string) => request<T>('DELETE', path),
  upload: <T>(path: string, form: FormData) => request<T>('POST', path, form),
};

export function trackEvent(type: 'whatsapp_click' | 'call_click', productSlug = '') {
  try {
    // Google Analytics 4 (when configured): count as a lead.
    const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
    gtag?.('event', 'generate_lead', { method: type === 'whatsapp_click' ? 'WhatsApp' : 'Call', item_id: productSlug || undefined });
    const body = JSON.stringify({ type, productSlug, path: window.location.pathname });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/events', new Blob([body], { type: 'application/json' }));
    } else {
      void fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true });
    }
  } catch {
    /* analytics must never break the page */
  }
}
