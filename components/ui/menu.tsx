'use client';

import { MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Portal, useDismiss, useFloating } from './popover';

export interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  onSelect?: () => void;
  href?: string;
  external?: boolean;
  danger?: boolean;
  hidden?: boolean;
}

/** "⋮" row-actions menu. */
export function ActionMenu({ items, label = 'Actions' }: { items: MenuItem[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const { anchorRef, panelRef, style } = useFloating(open, { align: 'end' });
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, [buttonRef, panelRef]);
  const visible = items.filter((i) => !i.hidden);

  const itemClass = (danger?: boolean) =>
    cn('flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition hover:bg-stone-100 focus:bg-stone-100 focus:outline-none', danger ? 'text-red-600' : 'text-stone-800');

  return (
    <>
      <button
        ref={(el) => {
          buttonRef.current = el;
          anchorRef.current = el;
        }}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className={cn('grid size-8 place-items-center rounded-lg text-stone-500 transition hover:bg-stone-100 hover:text-stone-900', open && 'bg-stone-100 text-stone-900')}
      >
        <MoreVertical className="size-4" />
      </button>
      {open && (
        <Portal>
          <div ref={panelRef} style={style} role="menu" onClick={(e) => e.stopPropagation()} className="min-w-44 overflow-hidden rounded-lg border border-stone-200 bg-white py-1 shadow-lg">
            {visible.map((item, i) => {
              const content = (
                <>
                  {item.icon && <span className="grid size-4 place-items-center [&>svg]:size-4">{item.icon}</span>}
                  {item.label}
                </>
              );
              const sep = item.danger && i > 0 && !visible[i - 1].danger ? <div className="my-1 h-px bg-stone-100" /> : null;
              if (item.href) {
                return (
                  <div key={item.label}>
                    {sep}
                    {item.external ? (
                      <a role="menuitem" href={item.href} target="_blank" rel="noopener noreferrer" onClick={close} className={itemClass(item.danger)}>
                        {content}
                      </a>
                    ) : (
                      <Link role="menuitem" href={item.href} onClick={close} className={itemClass(item.danger)}>
                        {content}
                      </Link>
                    )}
                  </div>
                );
              }
              return (
                <div key={item.label}>
                  {sep}
                  <button
                    role="menuitem"
                    type="button"
                    onClick={() => {
                      close();
                      item.onSelect?.();
                    }}
                    className={itemClass(item.danger)}
                  >
                    {content}
                  </button>
                </div>
              );
            })}
          </div>
        </Portal>
      )}
    </>
  );
}
