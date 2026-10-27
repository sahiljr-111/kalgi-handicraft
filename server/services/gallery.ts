import { isValidObjectId } from 'mongoose';
import { z } from 'zod';
import { connectDB } from '../db';
import { notFound } from '../http';
import { GalleryItem } from '../models';
import { revalidate } from '../revalidate';

const itemInput = z.object({
  title: z.string().trim().min(2, 'Title is required').max(160),
  caption: z.string().trim().max(500).optional().default(''),
  image: z.string().min(1, 'Choose an image'),
  category: z.union([z.literal(''), z.null(), z.string().refine(isValidObjectId)]).optional(),
  sortOrder: z.coerce.number().int().optional().default(0),
});

export async function listGallery() {
  await connectDB();
  return GalleryItem.find().sort({ sortOrder: 1, createdAt: -1 }).populate('category', 'name slug').lean();
}

export async function createGalleryItem(input: unknown) {
  await connectDB();
  const data = itemInput.parse(input);
  const item = await GalleryItem.create({ ...data, category: data.category || null });
  revalidate({ tags: ['gallery'], paths: ['/gallery'] });
  return item.toObject();
}

export async function updateGalleryItem(id: string, input: unknown) {
  await connectDB();
  const data = itemInput.parse(input);
  const item = await GalleryItem.findByIdAndUpdate(id, { $set: { ...data, category: data.category || null } }, { returnDocument: 'after' }).lean();
  if (!item) throw notFound('Gallery item');
  revalidate({ tags: ['gallery'], paths: ['/gallery'] });
  return item;
}

export async function deleteGalleryItem(id: string) {
  await connectDB();
  if (!(await GalleryItem.findByIdAndDelete(id))) throw notFound('Gallery item');
  revalidate({ tags: ['gallery'], paths: ['/gallery'] });
}
