'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/client';
import type { Media } from '@/lib/types';

const ACCEPT = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
const MAX_MB = 8;
// Phone photos are shrunk in the browser first: faster uploads, and big files fit under MAX_MB.
const MAX_SIDE = 2000;

type Mode = 'cloudinary' | 'local' | 'disabled';
let modePromise: Promise<Mode> | null = null;
const getMode = () => (modePromise ??= api.get<{ mode: Mode }>('/upload').then((r) => r.mode).catch(() => ((modePromise = null), 'disabled' as Mode)));

/** Re-encodes large JPEG/PNG/WebP photos to at most MAX_SIDE px (JPEG, 85%). Small ones are left as they are. */
async function shrink(file: File): Promise<File> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size < 1.5 * 1024 * 1024) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.fillStyle = '#fff'; // PNG transparency becomes white in JPEG
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

interface Signature { cloudName: string; apiKey: string; timestamp: number; folder: string; signature: string }

/** Browser → Cloudinary directly (no server size limits), then register the result. */
async function uploadToCloudinary(files: File[]): Promise<Media[]> {
  const sig = await api.post<Signature>('/upload/sign');
  const out: Media[] = [];
  for (const file of files) {
    const form = new FormData();
    form.append('file', file);
    form.append('api_key', sig.apiKey);
    form.append('timestamp', String(sig.timestamp));
    form.append('folder', sig.folder);
    form.append('signature', sig.signature);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: 'POST', body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message ?? `Upload of ${file.name} failed`);
    out.push(await api.post<Media>('/media', data));
  }
  return out;
}

export function useUpload() {
  const [uploading, setUploading] = useState(false);

  async function upload(files: FileList | File[]): Promise<Media[]> {
    const picked = await Promise.all(Array.from(files).map(shrink));
    const list = picked.filter((f) => {
      if (!ACCEPT.includes(f.type)) {
        toast.error(`${f.name}: use JPG, PNG or WebP images`);
        return false;
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        toast.error(`${f.name} is larger than ${MAX_MB} MB`);
        return false;
      }
      return true;
    });
    if (!list.length) return [];
    setUploading(true);
    try {
      const mode = await getMode();
      let media: Media[];
      if (mode === 'cloudinary') {
        media = await uploadToCloudinary(list);
      } else if (mode === 'local') {
        const form = new FormData();
        list.forEach((f) => form.append('files', f));
        media = await api.upload<Media[]>('/upload', form);
      } else {
        throw new Error('Image uploads are not set up yet. Add the Cloudinary settings to the server.');
      }
      toast.success(`${media.length} image${media.length === 1 ? '' : 's'} uploaded`);
      return media;
    } catch (e) {
      toast.error((e as Error).message);
      return [];
    } finally {
      setUploading(false);
    }
  }

  return { upload, uploading, accept: ACCEPT.join(',') };
}
