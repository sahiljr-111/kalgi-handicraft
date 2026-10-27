'use client';

import { ArrowLeft, ArrowRight, ImagePlus, Images, Star, Trash2, Upload } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui';
import type { ProductImage } from '@/lib/types';
import { cn, mediaUrl } from '@/lib/utils';
import { MediaPicker } from './MediaPicker';
import { useUpload } from './useUpload';

/**
 * Product photos. Every action is a visible, labelled button (no hidden
 * drag-only controls). The first photo is the main photo. Photo descriptions
 * for search engines are filled in automatically from the product name.
 */
export function ImageManager({ images, onChange, productName }: { images: ProductImage[]; onChange: (imgs: ProductImage[]) => void; productName: string }) {
  const { upload, uploading, accept } = useUpload();
  const input = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const normalise = (list: ProductImage[]) => list.map((img, i) => ({ ...img, isPrimary: i === 0, alt: img.alt || productName }));
  const add = (urls: string[]) => {
    const existing = new Set(images.map((i) => i.url));
    onChange(normalise([...images, ...urls.filter((u) => !existing.has(u)).map((url) => ({ url, alt: productName, isPrimary: false }))]));
  };
  const move = (from: number, to: number) => {
    if (to < 0 || to >= images.length || from === to) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(normalise(next));
  };

  async function handleFiles(files: FileList | File[]) {
    const media = await upload(files);
    if (media.length) add(media.map((m) => m.url));
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes('Files')) {
            e.preventDefault();
            setDragOver(true);
          }
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          if (!e.dataTransfer.files.length) return;
          e.preventDefault();
          setDragOver(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={cn('rounded-xl border border-dashed p-5 text-center transition', dragOver ? 'border-navy bg-navy/[0.04]' : 'border-stone-300 bg-stone-50')}
      >
        <ImagePlus className="mx-auto size-8 text-stone-400" />
        <p className="mt-2 text-sm text-stone-700">JPG or PNG photos, up to 8 MB each. You can choose several at once.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <input
            ref={input}
            type="file"
            accept={accept}
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files) void handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <Button type="button" onClick={() => input.current?.click()} loading={uploading}>
            <Upload className="size-4" /> {uploading ? 'Uploading…' : 'Add photos from computer'}
          </Button>
          <Button type="button" variant="outline" onClick={() => setPickerOpen(true)}>
            <Images className="size-4" /> Use a photo already uploaded
          </Button>
        </div>
      </div>

      {images.length > 0 && (
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((img, i) => (
            <li key={img.url} className={cn('overflow-hidden rounded-xl border bg-white', i === 0 ? 'border-navy' : 'border-stone-200')}>
              <div className="relative aspect-square bg-stone-100">
                <Image src={mediaUrl(img.url)} alt={img.alt} fill sizes="260px" className="object-cover" />
                <span className={cn('absolute top-3 left-3 rounded-lg px-2.5 py-1 text-sm font-semibold', i === 0 ? 'bg-navy text-white' : 'bg-white/90 text-stone-700')}>
                  {i === 0 ? 'Main photo' : `Photo ${i + 1}`}
                </span>
              </div>
              <div className="grid gap-2 p-3">
                {i !== 0 && (
                  <Button type="button" variant="outline" size="sm" onClick={() => move(i, 0)}>
                    <Star className="size-4" /> Make main photo
                  </Button>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Move photo ${i + 1} left`}>
                    <ArrowLeft className="size-4" /> Move
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => move(i, i + 1)} disabled={i === images.length - 1} aria-label={`Move photo ${i + 1} right`}>
                    Move <ArrowRight className="size-4" />
                  </Button>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => onChange(normalise(images.filter((_, j) => j !== i)))} className="text-red-700 hover:bg-red-50 hover:text-red-800">
                  <Trash2 className="size-4" /> Remove photo
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <MediaPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={add} multiple />
    </div>
  );
}
