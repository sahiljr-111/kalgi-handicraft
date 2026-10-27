'use client';

import { useParams } from 'next/navigation';
import { BlogForm } from '@/components/admin/BlogForm';
import { Skeleton } from '@/components/ui';
import type { BlogPost } from '@/lib/types';
import { useApi } from '@/lib/useApi';

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const { data, error } = useApi<BlogPost>(`/blog/id/${id}`);
  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <Skeleton className="h-96" />;
  return <BlogForm key={data._id} post={data} />;
}
