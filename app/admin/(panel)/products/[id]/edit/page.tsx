'use client';

import { useParams } from 'next/navigation';
import { ProductForm, toFormValues } from '@/components/admin/ProductForm';
import { Skeleton } from '@/components/ui';
import type { Product } from '@/lib/types';
import { useApi } from '@/lib/useApi';

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const { data, error } = useApi<Product>(`/products/id/${id}`);
  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <div className="grid gap-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-96" /></div>;
  return <ProductForm key={data._id} initial={toFormValues(data)} productId={data._id} />;
}
