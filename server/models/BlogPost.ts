import { Schema, deleteModel, model, models, type InferSchemaType } from 'mongoose';

const blogPostSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    excerpt: { type: String, default: '' },
    content: { type: String, default: '' }, // sanitized HTML
    featuredImage: { type: String, default: '' },
    featuredImageAlt: { type: String, default: '' },
    // Topic (shown as a filter on /blog) and free-form tags.
    topic: { type: String, default: '', index: true },
    tags: { type: [String], default: [] },
    relatedCategory: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    author: { type: String, default: 'Kalgi Handicraft' },
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
    ogImage: { type: String, default: '' }, // social-share image; falls back to featuredImage
    canonicalUrl: { type: String, default: '' }, // only when the article lives elsewhere first
    noindex: { type: Boolean, default: false },
    status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
    // Published posts with a future date are scheduled: hidden until that time.
    publishedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

export type BlogPostDoc = InferSchemaType<typeof blogPostSchema>;
// Re-register on hot reload so schema edits apply.
if (models.BlogPost) deleteModel('BlogPost');
export const BlogPost = model('BlogPost', blogPostSchema);
