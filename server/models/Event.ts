import { Schema, deleteModel, model, models } from 'mongoose';

/** Lightweight analytics events (e.g. WhatsApp CTA clicks). */
const eventSchema = new Schema(
  {
    type: { type: String, enum: ['whatsapp_click', 'call_click'], required: true },
    productSlug: { type: String, default: '' },
    path: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

eventSchema.index({ createdAt: -1 });

// Re-register on hot reload so schema edits apply.
if (models.Event) deleteModel('Event');
export const Event = model('Event', eventSchema);
