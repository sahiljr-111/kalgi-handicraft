import { Schema, deleteModel, model, models, type InferSchemaType } from 'mongoose';

export const INQUIRY_STATUSES = ['new', 'contacted', 'converted', 'closed'] as const;

const inquirySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: '', trim: true, lowercase: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', default: null },
    productName: { type: String, default: '' },
    quantity: { type: Number, default: null },
    message: { type: String, default: '' },
    source: { type: String, enum: ['form', 'whatsapp'], default: 'form' },
    status: { type: String, enum: INQUIRY_STATUSES, default: 'new', index: true },
    notes: { type: String, default: '' },
    archived: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

inquirySchema.index({ createdAt: -1 });

export type InquiryDoc = InferSchemaType<typeof inquirySchema>;
// Re-register on hot reload so schema edits apply.
if (models.Inquiry) deleteModel('Inquiry');
export const Inquiry = model('Inquiry', inquirySchema);
