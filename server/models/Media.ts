import { Schema, deleteModel, model, models, type InferSchemaType } from 'mongoose';

const mediaSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: '' }, // Cloudinary public id, local filename, or static seed file
    provider: { type: String, enum: ['cloudinary', 'local', 'static'], required: true },
    filename: { type: String, default: '' },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    bytes: { type: Number, default: 0 },
    format: { type: String, default: '' },
  },
  { timestamps: true },
);

export type MediaDoc = InferSchemaType<typeof mediaSchema>;
// Re-register on hot reload so schema edits apply.
if (models.Media) deleteModel('Media');
export const Media = model('Media', mediaSchema);
