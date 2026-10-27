import { Schema, deleteModel, model, models, type InferSchemaType } from 'mongoose';

const imageSchema = new Schema(
  {
    url: { type: String, required: true },
    alt: { type: String, default: '' },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false },
);

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    priceFrom: { type: Number, required: true, min: 0 },
    unit: { type: String, default: 'per piece' },
    material: { type: String, default: '' },
    size: { type: String, default: '' },
    colorOptions: { type: [String], default: [] },
    moq: { type: Number, default: 1, min: 1 },
    images: { type: [imageSchema], default: [] },
    description: { type: String, default: '' },
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
    isFeatured: { type: Boolean, default: false }, // "Top selling" on the home page
    showInHero: { type: Boolean, default: false }, // big photo display at the top of the home page
    noindex: { type: Boolean, default: false }, // visible on site but kept out of search engines
    // Id of the listing this product was imported from (e.g. IndiaMART), for re-runnable imports.
    sourceId: { type: String, default: undefined, index: { unique: true, sparse: true } },
    status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
  },
  { timestamps: true },
);

productSchema.index({ name: 'text', description: 'text', material: 'text' });

export type ProductDoc = InferSchemaType<typeof productSchema>;
// Re-register on hot reload so schema edits apply.
if (models.Product) deleteModel('Product');
export const Product = model('Product', productSchema);
