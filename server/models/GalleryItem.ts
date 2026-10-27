import { Schema, deleteModel, model, models, type InferSchemaType } from 'mongoose';

const galleryItemSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    caption: { type: String, default: '' },
    image: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type GalleryItemDoc = InferSchemaType<typeof galleryItemSchema>;
// Re-register on hot reload so schema edits apply.
if (models.GalleryItem) deleteModel('GalleryItem');
export const GalleryItem = model('GalleryItem', galleryItemSchema);
