'use client';

import { Check, ImagePlus, Upload } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { Button, Dialog, EmptyState, Skeleton } from '@/components/ui';
import type { Media, Paginated } from '@/lib/types';
import { useApi } from '@/lib/useApi';
import { cn, mediaUrl } from '@/lib/utils';
import { useUpload } from './useUpload';

/** Browse the media library and pick one or more images, or upload new ones. */
export function MediaPicker({
  open,
  onClose,
  onSelect,
  multiple = false,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (urls: string[]) => void;
  multiple?: boolean;
}) {
  const { data, loading, reload } = useApi<Paginated<Media>>(open ? '/media?limit=200' : null);
  const [selected, setSelected] = useState<string[]>([]);
  const { upload, uploading, accept } = useUpload();
  const input = useRef<HTMLInputElement>(null);

  const toggle = (url: string) =>
    setSelected((s) => (multiple ? (s.includes(url) ? s.filter((u) => u !== url) : [...s, url]) : [url]));

  function done() {
    onSelect(selected);
    setSelected([]);
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="xl"
      title="Choose photos"
      description={multiple ? 'Tap the photos you want, then press the button at the bottom.' : 'Tap a photo, then press the button at the bottom.'}
      footer={
        <>
          <span className="mr-auto self-center text-sm text-stone-600">{selected.length ? `${selected.length} chosen` : 'Nothing chosen yet'}</span>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={done} disabled={!selected.length}>Use {multiple && selected.length > 1 ? `these ${selected.length} photos` : 'this photo'}</Button>
        </>
      }
    >
      <div className="mb-4 flex justify-end">
        <input
          ref={input}
          type="file"
          accept={accept}
          multiple
          hidden
          onChange={async (e) => {
            if (!e.target.files) return;
            const media = await upload(e.target.files);
            e.target.value = '';
            await reload(true);
            if (media.length) setSelected((s) => (multiple ? [...s, ...media.map((m) => m.url)] : [media[0].url]));
          }}
        />
        <Button variant="outline" onClick={() => input.current?.click()} loading={uploading}><Upload className="size-4" /> Upload new photos</Button>
      </div>
      {loading && !data ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">{Array.from({ length: 10 }, (_, i) => <Skeleton key={i} className="aspect-square" />)}</div>
      ) : data?.items.length ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-6">
          {data.items.map((m) => {
            const isSel = selected.includes(m.url);
            return (
              <button
                key={m._id}
                type="button"
                onClick={() => toggle(m.url)}
                aria-pressed={isSel}
                className={cn('relative aspect-square overflow-hidden rounded-lg border bg-stone-100 transition', isSel ? 'border-navy ring-4 ring-navy/20' : 'border-transparent hover:border-stone-300')}
                title={m.filename}
              >
                <Image src={mediaUrl(m.url)} alt={m.filename} fill sizes="160px" className="object-cover" />
                {isSel && <span className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-navy text-white"><Check className="size-4" /></span>}
              </button>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={<ImagePlus className="size-5" />} title="No photos yet" description="Press “Upload new photos” to add some." />
      )}
    </Dialog>
  );
}

/** A single-image field: preview + choose/remove. */
export function ImageField({ value, onChange, label = 'Image', aspect = 'aspect-video' }: { value: string; onChange: (url: string) => void; label?: string; aspect?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-stone-900">{label}</p>
      <div className={cn('relative overflow-hidden rounded-lg border border-dashed border-stone-300 bg-stone-50', aspect)}>
        {value ? (
          <Image src={mediaUrl(value)} alt="" fill sizes="400px" className="object-cover" />
        ) : (
          <button type="button" onClick={() => setOpen(true)} className="flex h-full w-full flex-col items-center justify-center gap-2 text-sm text-stone-500 hover:text-stone-800">
            <ImagePlus className="size-5" /> Choose a photo
          </button>
        )}
      </div>
      {value && (
        <div className="mt-2 flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>Change photo</Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')} className="text-red-700 hover:bg-red-50">Remove</Button>
        </div>
      )}
      <MediaPicker open={open} onClose={() => setOpen(false)} onSelect={(urls) => urls[0] && onChange(urls[0])} />
    </div>
  );
}
