'use client';

import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { ActionMenu, type MenuItem } from './menu';
import { Select } from './select';

export type SortDir = 'asc' | 'desc';
export interface SortState {
  key: string;
  dir: SortDir;
}

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  className?: string;
  /** Hide below this breakpoint to keep small screens readable. */
  hideBelow?: 'sm' | 'md' | 'lg';
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  /** Search box in the toolbar. */
  search?: { value: string; onChange: (v: string) => void; placeholder?: string };
  /** Extra filter controls shown next to the search box. */
  filters?: React.ReactNode;
  /** True when any filter/search is active (shows "Clear"). */
  filtered?: boolean;
  onClear?: () => void;
  sort?: SortState;
  onSortChange?: (s: SortState) => void;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
  onPageSizeChange?: (n: number) => void;
  rowActions?: (row: T) => MenuItem[];
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string | undefined;
  empty?: { title: string; description?: string; action?: React.ReactNode };
}

const hide = { sm: 'hidden sm:table-cell', md: 'hidden md:table-cell', lg: 'hidden lg:table-cell' };
const alignCls = { left: 'text-left', right: 'text-right', center: 'text-center' };

/**
 * Reusable data table: toolbar (search + filters), sortable headers, row click,
 * "⋮" row actions and pagination. Works with server-side data (pass the current
 * page's rows and `total`) or with `useClientTable` for small lists.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  search,
  filters,
  filtered,
  onClear,
  sort,
  onSortChange,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  rowActions,
  onRowClick,
  rowClassName,
  empty,
}: Props<T>) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(total, page * pageSize);
  const colCount = columns.length + (rowActions ? 1 : 0);

  function toggleSort(key: string) {
    if (!onSortChange) return;
    if (sort?.key === key) onSortChange({ key, dir: sort.dir === 'asc' ? 'desc' : 'asc' });
    else onSortChange({ key, dir: 'asc' });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
      {(search || filters) && (
        <div className="flex flex-wrap items-center gap-3 border-b border-stone-200 p-3">
          {search && (
            <div className="relative min-w-[14rem] flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400" />
              <input
                type="search"
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
                placeholder={search.placeholder ?? 'Search…'}
                aria-label={search.placeholder ?? 'Search'}
                className="h-9 w-full rounded-lg border border-stone-300 bg-white pr-3 pl-9 text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-navy focus:ring-3 focus:ring-navy/10"
              />
            </div>
          )}
          {filters}
          {filtered && onClear && (
            <button type="button" onClick={onClear} className="inline-flex h-9 items-center gap-1 rounded-lg px-2.5 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900">
              <X className="size-4" /> Clear
            </button>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-stone-200 bg-stone-50/70">
            <tr>
              {columns.map((c) => {
                const active = sort?.key === c.key;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={active ? (sort!.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                    className={cn('px-4 py-2.5 text-xs font-semibold whitespace-nowrap text-stone-500', alignCls[c.align ?? 'left'], c.hideBelow && hide[c.hideBelow], c.className)}
                  >
                    {c.sortable && onSortChange ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(c.key)}
                        className={cn('inline-flex items-center gap-1 rounded hover:text-stone-900', active && 'text-stone-900', c.align === 'right' && 'flex-row-reverse')}
                      >
                        {c.header}
                        {active ? (sort!.dir === 'asc' ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />) : <ChevronsUpDown className="size-3.5 opacity-50" />}
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
              {rowActions && <th className="w-12 px-2"><span className="sr-only">Actions</span></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {loading && !rows.length ? (
              Array.from({ length: 5 }, (_, i) => (
                <tr key={i}>
                  <td colSpan={colCount} className="px-4 py-3">
                    <div className="h-5 animate-pulse rounded bg-stone-100" />
                  </td>
                </tr>
              ))
            ) : rows.length ? (
              rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn('transition', onRowClick && 'cursor-pointer hover:bg-stone-50', loading && 'opacity-60', rowClassName?.(row))}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={cn('px-4 py-3 align-middle', alignCls[c.align ?? 'left'], c.hideBelow && hide[c.hideBelow], c.className)}>
                      {c.cell(row)}
                    </td>
                  ))}
                  {rowActions && (
                    <td className="px-2 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <ActionMenu items={rowActions(row)} />
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={colCount} className="px-4 py-14 text-center">
                  <p className="font-medium text-stone-900">{empty?.title ?? 'Nothing found'}</p>
                  {empty?.description && <p className="mx-auto mt-1 max-w-sm text-sm text-stone-500">{empty.description}</p>}
                  {empty?.action && <div className="mt-4">{empty.action}</div>}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 px-4 py-2.5 text-sm text-stone-600">
        <div className="flex items-center gap-3">
          <span>{total ? `Showing ${from}–${to} of ${total}` : 'No results'}</span>
          {onPageSizeChange && (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline">Rows</span>
              <div className="w-20">
                <Select value={String(pageSize)} onChange={(e) => onPageSizeChange(Number(e.target.value))} aria-label="Rows per page">
                  {[10, 20, 50].map((n) => <option key={n} value={String(n)}>{n}</option>)}
                </Select>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="grid size-8 place-items-center rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="px-2 tabular-nums">
            Page {Math.min(page, pages)} of {pages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= pages}
            className="grid size-8 place-items-center rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Search, sort and paginate a small list in the browser.
 * `sorters` maps a column key to the value to sort by.
 */
export function useClientTable<T>(
  rows: T[] | null | undefined,
  { searchText, sorters, defaultSort, pageSize: initialSize = 10, filter }: {
    searchText: (row: T) => string;
    sorters: Record<string, (row: T) => string | number>;
    defaultSort?: SortState;
    pageSize?: number;
    filter?: (row: T) => boolean;
  },
) {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<SortState | undefined>(defaultSort);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialSize);

  const all = useMemo(() => {
    let list = rows ?? [];
    if (filter) list = list.filter(filter);
    const needle = q.trim().toLowerCase();
    if (needle) list = list.filter((r) => searchText(r).toLowerCase().includes(needle));
    if (sort && sorters[sort.key]) {
      const get = sorters[sort.key];
      list = [...list].sort((a, b) => {
        const x = get(a);
        const y = get(b);
        const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), undefined, { numeric: true, sensitivity: 'base' });
        return sort.dir === 'asc' ? c : -c;
      });
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, q, sort, filter]);

  const pages = Math.max(1, Math.ceil(all.length / pageSize));
  const safePage = Math.min(page, pages);
  return {
    rows: all.slice((safePage - 1) * pageSize, safePage * pageSize),
    total: all.length,
    page: safePage,
    pageSize,
    q,
    sort,
    setQ: (v: string) => {
      setQ(v);
      setPage(1);
    },
    setSort: (s: SortState) => {
      setSort(s);
      setPage(1);
    },
    setPage,
    setPageSize: (n: number) => {
      setPageSize(n);
      setPage(1);
    },
  };
}
