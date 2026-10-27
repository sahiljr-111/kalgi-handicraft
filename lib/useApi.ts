'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './client';

/** Minimal data-fetching hook for the admin: GET on mount/key change, with manual reload and optional polling. */
export function useApi<T>(path: string | null, { pollMs }: { pollMs?: number } = {}) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const current = useRef(path);
  current.current = path;

  const load = useCallback(
    async (silent = false) => {
      if (!path) return;
      if (!silent) setLoading(true);
      try {
        const result = await api.get<T>(path);
        if (current.current === path) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (current.current === path) setError((err as Error).message);
      } finally {
        if (current.current === path) setLoading(false);
      }
    },
    [path],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!pollMs) return;
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') void load(true);
    }, pollMs);
    return () => clearInterval(id);
  }, [load, pollMs]);

  return { data, setData, error, loading, reload: load };
}
