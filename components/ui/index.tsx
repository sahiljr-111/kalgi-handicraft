'use client';

import { Loader2, X } from 'lucide-react';
import { forwardRef, useEffect, useId, useRef } from 'react';
import { cn } from '@/lib/utils';

/* Small shadcn/ui-style primitives for the admin dashboard. */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-navy text-white hover:bg-navy-deep shadow-sm',
  secondary: 'bg-stone-100 text-stone-900 hover:bg-stone-200',
  outline: 'border border-stone-300 bg-white text-stone-800 hover:bg-stone-50',
  ghost: 'text-stone-700 hover:bg-stone-100 hover:text-stone-900',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
};
const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-10 px-4 text-sm gap-2',
  icon: 'size-9 justify-center',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, className, children, disabled, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-lg font-medium whitespace-nowrap transition disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
});

export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) {
  return cn('inline-flex shrink-0 items-center justify-center rounded-lg font-medium whitespace-nowrap transition', variants[variant], sizes[size], className);
}

const fieldBase =
  'w-full rounded-lg border bg-white px-3 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-navy focus:ring-3 focus:ring-navy/10 disabled:bg-stone-50';

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(function Input(
  { className, invalid, ...props },
  ref,
) {
  return <input ref={ref} aria-invalid={invalid || undefined} className={cn(fieldBase, 'h-9', invalid ? 'border-red-500' : 'border-stone-300', className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(function Textarea(
  { className, invalid, ...props },
  ref,
) {
  return <textarea ref={ref} aria-invalid={invalid || undefined} className={cn(fieldBase, 'py-2 leading-relaxed', invalid ? 'border-red-500' : 'border-stone-300', className)} {...props} />;
});

/** Label + control + hint/error, with ids wired up for accessibility. */
export function Field({
  label,
  hint,
  error,
  children,
  className,
  htmlFor,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={cn('grid gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-stone-700">{label}</label>
      {children}
      {error ? <p className="text-xs text-red-600">{error}</p> : hint ? <p className="text-xs text-stone-500">{hint}</p> : null}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('rounded-xl border border-stone-200 bg-white shadow-[0_1px_2px_rgb(0_0_0/0.04)]', className)}>{children}</div>;
}

export function CardHeader({ title, description, action }: { title: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-100 px-5 py-4">
      <div>
        <h2 className="font-sans text-[0.95rem] font-semibold tracking-normal text-stone-900">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-stone-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

const badgeTones = {
  neutral: 'bg-stone-100 text-stone-800 ring-stone-300',
  green: 'bg-emerald-50 text-emerald-900 ring-emerald-300',
  amber: 'bg-amber-50 text-amber-900 ring-amber-300',
  blue: 'bg-sky-50 text-sky-900 ring-sky-300',
  red: 'bg-rose-50 text-rose-900 ring-rose-300',
  violet: 'bg-violet-50 text-violet-900 ring-violet-300',
};
export type BadgeTone = keyof typeof badgeTones;

export function Badge({ tone = 'neutral', children, className }: { tone?: BadgeTone; children: React.ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset', badgeTones[tone], className)}>{children}</span>;
}

export function Switch({ checked, onChange, label, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; id?: string }) {
  const auto = useId();
  return (
    <button
      id={id ?? auto}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn('relative inline-flex h-6 w-11 shrink-0 rounded-full transition', checked ? 'bg-navy' : 'bg-stone-300')}
    >
      <span className={cn('absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition', checked && 'translate-x-5')} />
    </button>
  );
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'md' | 'lg' | 'xl';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  // Runs only when the dialog opens/closes, so re-renders never steal focus from inputs.
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    // Focus the first autofocus field if there is one, otherwise the dialog itself.
    const auto = ref.current?.querySelector<HTMLElement>('[autofocus], [data-autofocus]');
    (auto ?? ref.current)?.focus();
    const onKey = (e: KeyboardEvent) => {
      // Let an open dropdown handle Escape first.
      if (e.key === 'Escape' && !document.querySelector('[role=listbox], [role=menu]')) onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative flex max-h-[90vh] w-full flex-col rounded-2xl bg-white shadow-2xl outline-none',
          size === 'md' && 'max-w-md',
          size === 'lg' && 'max-w-2xl',
          size === 'xl' && 'max-w-5xl',
        )}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-3">
          <div>
            <h2 className="font-sans text-lg font-semibold tracking-normal text-stone-900">{title}</h2>
            {description && <p className="mt-1 text-sm text-stone-500">{description}</p>}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close"><X className="size-4" /></Button>
        </div>
        {children && <div className="overflow-y-auto px-6 pb-4">{children}</div>}
        {footer && <div className="flex flex-wrap justify-end gap-3 border-t border-stone-100 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Delete',
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </>
      }
    />
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-sans text-2xl font-semibold tracking-tight text-stone-900">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-stone-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      {icon && <div className="mb-4 grid size-12 place-items-center rounded-full bg-stone-100 text-stone-500">{icon}</div>}
      <p className="font-medium text-stone-900">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-stone-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-stone-200/70', className)} />;
}

export function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-stone-100 px-5 py-3 text-sm text-stone-600">
      <span>Page {page} of {pages}</span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</Button>
        <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next</Button>
      </div>
    </div>
  );
}

/** Read-only dashboard figure. */
export function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-stone-500">{label}</p>
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-navy/[0.06] text-navy [&>svg]:size-[1.1rem]">{icon}</span>
      </div>
      <p className="mt-2 text-[1.75rem] leading-none font-semibold text-stone-900 tabular-nums">{value}</p>
      {sub && <p className="mt-2 text-xs text-stone-500">{sub}</p>}
    </div>
  );
}

export { Select } from './select';
export { ActionMenu, type MenuItem } from './menu';
export { DataTable, useClientTable, type Column, type SortState } from './data-table';
