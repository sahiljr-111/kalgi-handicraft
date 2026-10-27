'use client';

import { ImagePlus, Trash2, Upload } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useUpload } from '@/components/admin/useUpload';
import { Button, Card, ConfirmDialog, EmptyState, PageHeader, Pagination, Skeleton } from '@/components/ui';
import { api } from '@/lib/client';
import type { Media, Paginated } from '@/lib/types';
import { useApi } from '@/lib/useApi';
import { cn, formatDate, mediaUrl } from '@/lib/utils';

export default function MediaPage() {
  const [page, setPage] = useState(1);
  const { data, loading, reload } = useApi<Paginated<Media>>(`/media?page=${page}&limit=24`);
  const { upload, uploading, accept } = useUpload();
  const input = useRef<HTMLInputElement>(null);
  const [toDelete, setToDelete] = useState<Media | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handle(files: FileList) {
    if ((await upload(files)).length) void reload(true);
  }

  async function remove() {
    if (!toDelete) return;
    try {
      await api.del(`/media/${toDelete._id}`);
      toast.success('Photo deleted');
      void reload(true);
    } catch (e) {
      toast.error((e as Error).message);
    }
    setToDelete(null);
  }

  return (
    <>
      <PageHeader
        title="Photos"
        description="All the photos you have uploaded. You can use them again for products, categories, the work gallery and blogs."
        actions={
          <>
            <input
              ref={input}
              type="file"
              accept={accept}
              multiple
              hidden
              onChange={(e) => {
                if (e.target.files) void handle(e.target.files);
                e.target.value = '';
              }}
            />
            <Button size="lg" onClick={() => input.current?.click()} loading={uploading}>
              <Upload className="size-4" /> {uploading ? 'Uploading…' : 'Upload photos'}
            </Button>
          </>
        }
      />
      <Card className={cn('transition', dragOver && 'ring-2 ring-navy')}>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files.length) void handle(e.dataTransfer.files);
          }}
          className="p-5"
        >
          {loading && !data ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}</div>
          ) : data?.items.length ? (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {data.items.map((m) => (
                <li key={m._id} className="overflow-hidden rounded-xl border border-stone-200">
                  <div className="relative aspect-square bg-stone-100">
                    <Image src={mediaUrl(m.url)} alt={m.filename} fill sizes="240px" className="object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-stone-600">Uploaded {formatDate(m.createdAt)}</p>
                    <Button variant="ghost" size="sm" onClick={() => setToDelete(m)} className="mt-2 w-full text-red-700 hover:bg-red-50 hover:text-red-800">
                      <Trash2 className="size-4" /> Delete photo
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={<ImagePlus className="size-5" />} title="No photos yet" description="Press “Upload photos” to add your first photos." />
          )}
        </div>
        {data && <Pagination page={data.page} pages={data.pages} onChange={setPage} />}
      </Card>
      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        title="Delete this photo?"
        description="It will be removed from your photos. A photo that is used by a product cannot be deleted until you remove it from that product."
        confirmLabel="Yes, delete it"
      />
    </>
  );
}
