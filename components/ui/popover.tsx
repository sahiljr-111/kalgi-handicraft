'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Positions a floating panel under (or above) an anchor element. Rendered in a
 * portal with fixed positioning, so it isn't clipped by scrolling containers
 * such as dialogs or tables.
 */
export function useFloating(open: boolean, { align = 'start', matchWidth = false }: { align?: 'start' | 'end'; matchWidth?: boolean } = {}) {
  const anchorRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [style, setStyle] = useState<React.CSSProperties>({ position: 'fixed', top: -9999, left: -9999 });

  const update = useCallback(() => {
    const a = anchorRef.current;
    const p = panelRef.current;
    if (!a) return;
    const r = a.getBoundingClientRect();
    const ph = p?.offsetHeight ?? 0;
    const pw = matchWidth ? r.width : (p?.offsetWidth ?? 0);
    const below = r.bottom + 4 + ph <= window.innerHeight || r.top < ph + 8;
    const top = below ? r.bottom + 4 : r.top - ph - 4;
    let left = align === 'end' ? r.right - pw : r.left;
    left = Math.max(8, Math.min(left, window.innerWidth - pw - 8));
    setStyle({ position: 'fixed', top, left, ...(matchWidth ? { width: r.width } : {}), zIndex: 70 });
  }, [align, matchWidth]);

  useLayoutEffect(() => {
    if (!open) return;
    update();
    // Measure again once the panel has its real size.
    const id = requestAnimationFrame(update);
    return () => cancelAnimationFrame(id);
  }, [open, update]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, update]);

  return { anchorRef, panelRef, style, update };
}

/** Closes on outside click or Escape. */
export function useDismiss(open: boolean, onClose: () => void, refs: React.RefObject<HTMLElement | null>[]) {
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => {
      if (refs.every((r) => !r.current?.contains(e.target as Node))) onClose();
    };
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', down);
      document.removeEventListener('keydown', key);
    };
  }, [open, onClose, refs]);
}

/** Floating panels only open after a user action, so document is always available. */
export function Portal({ children }: { children: React.ReactNode }) {
  return typeof document === 'undefined' ? null : createPortal(children, document.body);
}
