'use client';

import { Check, ChevronDown, Plus, Search } from 'lucide-react';
import { Children, isValidElement, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Portal, useDismiss, useFloating } from './popover';

interface Option {
  value: string;
  label: React.ReactNode;
  text: string;
  disabled?: boolean;
}

export interface SelectProps {
  id?: string;
  value: string;
  /** Called with a change-like event so it can replace a native <select>. */
  onChange: (e: { target: { value: string } }) => void;
  /** Native-style <option> children, or pass `options`. */
  children?: React.ReactNode;
  options?: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
  /** Optional action at the bottom of the list, e.g. "Add new category". */
  action?: { label: string; onSelect: () => void };
  /** `admin` (dashboard, default) or `site` (public website: ivory, rounded, brand colours). */
  variant?: 'admin' | 'site';
}

/** Lists longer than this get a search box. */
const SEARCH_FROM = 12;

function readOptions(children: React.ReactNode): Option[] {
  const out: Option[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement<{ value?: string; children?: React.ReactNode; disabled?: boolean }>(child)) return;
    const label = child.props.children;
    const text = Children.toArray(label).join('');
    out.push({ value: String(child.props.value ?? text), label, text, disabled: child.props.disabled });
  });
  return out;
}

const STYLES = {
  admin: {
    button: 'h-9 rounded-lg bg-white px-3 text-stone-900 focus-visible:ring-3 focus-visible:ring-navy/10 disabled:bg-stone-50 disabled:text-stone-400',
    idle: 'border-stone-300 hover:border-stone-400',
    open: 'border-navy ring-3 ring-navy/10',
    placeholder: 'text-stone-400',
    chevron: 'text-stone-500',
    panel: 'rounded-lg border-stone-200 bg-white shadow-lg',
    option: 'px-3 py-2',
    active: 'bg-stone-100',
    text: 'text-stone-800',
    divider: 'border-stone-100',
  },
  site: {
    button: 'h-10 rounded-full bg-white/60 px-4 text-ink-soft disabled:opacity-60',
    idle: 'border-line hover:border-navy/40',
    open: 'border-navy',
    placeholder: 'text-muted',
    chevron: 'text-muted',
    panel: 'rounded-2xl border-line bg-ivory shadow-[0_18px_40px_-16px_rgb(30_31_51/0.35)]',
    option: 'px-4 py-2.5',
    active: 'bg-paper',
    text: 'text-ink',
    divider: 'border-line',
  },
} as const;

/** Theme-styled dropdown (listbox) with keyboard support. Drop-in for a native <select>. */
export function Select({ id, value, onChange, children, options: optionsProp, placeholder = 'Select…', invalid, disabled, className, action, variant = 'admin', ...aria }: SelectProps) {
  const autoId = useId();
  const listId = `${id ?? autoId}-list`;
  const st = STYLES[variant];
  const options = useMemo<Option[]>(
    () => (optionsProp ? optionsProp.map((o) => ({ ...o, text: o.label })) : readOptions(children)),
    [optionsProp, children],
  );
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [query, setQuery] = useState('');
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const { anchorRef, panelRef, style } = useFloating(open, { matchWidth: true });
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, [buttonRef, panelRef]);

  const searchable = options.length > SEARCH_FROM;
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.text.toLowerCase().includes(q)) : options;
  }, [options, query]);
  const selected = options.find((o) => o.value === value);
  const count = visible.length + (action ? 1 : 0);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    if (searchable) requestAnimationFrame(() => searchRef.current?.focus());
  }, [open, options, value, searchable]);

  useEffect(() => {
    if (!open || active < 0) return;
    panelRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active, panelRef]);

  function choose(i: number) {
    if (action && i === visible.length) {
      setOpen(false);
      action.onSelect();
      return;
    }
    const o = visible[i];
    if (!o || o.disabled) return;
    onChange({ target: { value: o.value } });
    setOpen(false);
    buttonRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent, fromSearch = false) {
    if (disabled) return;
    if (!open && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(count - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter' || (e.key === ' ' && !fromSearch)) {
      e.preventDefault();
      choose(active);
    } else if (e.key === 'Escape') {
      setOpen(false);
      buttonRef.current?.focus();
    } else if (e.key === 'Tab') {
      setOpen(false);
    } else if (!fromSearch && e.key.length === 1) {
      const i = visible.findIndex((o) => o.text.toLowerCase().startsWith(e.key.toLowerCase()));
      if (i >= 0) setActive(i);
    }
  }

  return (
    <>
      <button
        ref={(el) => {
          buttonRef.current = el;
          anchorRef.current = el;
        }}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-invalid={invalid || undefined}
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => onKeyDown(e)}
        className={cn(
          'flex w-full items-center justify-between gap-2 border text-left text-sm transition outline-none focus-visible:border-navy',
          st.button,
          invalid ? 'border-red-500' : open ? st.open : st.idle,
          className,
        )}
        {...aria}
      >
        <span className={cn('truncate', !selected && st.placeholder)}>{selected ? selected.label : placeholder}</span>
        <ChevronDown className={cn('size-4 shrink-0 transition', st.chevron, open && 'rotate-180')} />
      </button>
      {open && (
        <Portal>
          <div ref={panelRef} style={style} className={cn('overflow-hidden border', st.panel)}>
            {searchable && (
              <div className={cn('relative border-b', st.divider)}>
                <Search className={cn('pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2', st.chevron)} />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActive(0);
                  }}
                  onKeyDown={(e) => onKeyDown(e, true)}
                  placeholder="Search…"
                  aria-label="Search options"
                  aria-controls={listId}
                  className="h-10 w-full bg-transparent pr-3 pl-10 text-sm outline-none"
                />
              </div>
            )}
            <ul id={listId} role="listbox" aria-labelledby={id} className="max-h-64 overflow-y-auto overscroll-contain py-1">
              {visible.map((o, i) => (
                <li
                  key={o.value + i}
                  id={`${listId}-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={o.value === value}
                  aria-disabled={o.disabled || undefined}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(i)}
                  className={cn(
                    'flex cursor-pointer items-center justify-between gap-3 text-sm',
                    st.option,
                    i === active && st.active,
                    o.value === value ? 'font-medium text-navy' : st.text,
                    o.disabled && 'cursor-not-allowed opacity-50',
                  )}
                >
                  <span className="truncate">{o.label}</span>
                  {o.value === value && <Check className={cn('size-4 shrink-0', variant === 'site' && 'text-gold')} />}
                </li>
              ))}
              {!visible.length && <li className={cn('text-sm', st.option, st.placeholder)}>{query ? 'No matches' : 'No options'}</li>}
            </ul>
            {action && (
              <button
                type="button"
                data-index={visible.length}
                onMouseEnter={() => setActive(visible.length)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(visible.length)}
                className={cn('flex w-full items-center gap-2 border-t px-3 py-2.5 text-left text-sm font-medium text-navy', st.divider, active === visible.length && st.active)}
              >
                <Plus className="size-4" /> {action.label}
              </button>
            )}
          </div>
        </Portal>
      )}
    </>
  );
}
