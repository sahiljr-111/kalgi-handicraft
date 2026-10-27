'use client';

import { Check, ChevronDown, Plus } from 'lucide-react';
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
}

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

/** Theme-styled dropdown (listbox) with keyboard support. Drop-in for a native <select>. */
export function Select({ id, value, onChange, children, options: optionsProp, placeholder = 'Select…', invalid, disabled, className, action, ...aria }: SelectProps) {
  const autoId = useId();
  const listId = `${id ?? autoId}-list`;
  const options = useMemo<Option[]>(
    () => (optionsProp ? optionsProp.map((o) => ({ ...o, text: o.label })) : readOptions(children)),
    [optionsProp, children],
  );
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const { anchorRef, panelRef, style } = useFloating(open, { matchWidth: true });
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, [buttonRef, panelRef]);

  const selected = options.find((o) => o.value === value);
  const count = options.length + (action ? 1 : 0);

  useEffect(() => {
    if (open) setActive(Math.max(0, options.findIndex((o) => o.value === value)));
  }, [open, options, value]);

  useEffect(() => {
    if (!open || active < 0) return;
    panelRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active, panelRef]);

  function choose(i: number) {
    if (action && i === options.length) {
      setOpen(false);
      action.onSelect();
      return;
    }
    const o = options[i];
    if (!o || o.disabled) return;
    onChange({ target: { value: o.value } });
    setOpen(false);
    buttonRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent) {
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
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      choose(active);
    } else if (e.key === 'Tab') {
      setOpen(false);
    } else if (e.key.length === 1) {
      const i = options.findIndex((o) => o.text.toLowerCase().startsWith(e.key.toLowerCase()));
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
        onKeyDown={onKeyDown}
        className={cn(
          'flex h-9 w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 text-left text-sm text-stone-900 transition outline-none focus-visible:border-navy focus-visible:ring-3 focus-visible:ring-navy/10 disabled:bg-stone-50 disabled:text-stone-400',
          invalid ? 'border-red-500' : open ? 'border-navy ring-3 ring-navy/10' : 'border-stone-300 hover:border-stone-400',
          className,
        )}
        {...aria}
      >
        <span className={cn('truncate', !selected && 'text-stone-400')}>{selected ? selected.label : placeholder}</span>
        <ChevronDown className={cn('size-4 shrink-0 text-stone-500 transition', open && 'rotate-180')} />
      </button>
      {open && (
        <Portal>
          <div ref={panelRef} style={style} className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-lg">
            <ul id={listId} role="listbox" aria-labelledby={id} className="max-h-64 overflow-y-auto py-1">
              {options.map((o, i) => (
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
                    'flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm',
                    i === active ? 'bg-stone-100' : '',
                    o.value === value ? 'font-medium text-navy' : 'text-stone-800',
                    o.disabled && 'cursor-not-allowed opacity-50',
                  )}
                >
                  <span className="truncate">{o.label}</span>
                  {o.value === value && <Check className="size-4 shrink-0" />}
                </li>
              ))}
              {!options.length && <li className="px-3 py-2 text-sm text-stone-500">No options</li>}
            </ul>
            {action && (
              <button
                type="button"
                data-index={options.length}
                onMouseEnter={() => setActive(options.length)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(options.length)}
                className={cn('flex w-full items-center gap-2 border-t border-stone-100 px-3 py-2.5 text-left text-sm font-medium text-navy', active === options.length && 'bg-stone-100')}
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
