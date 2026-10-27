import { Schema, deleteModel, model, models, type InferSchemaType } from 'mongoose';

/** Old URL -> new URL. Created automatically when a slug changes, and editable in the dashboard. */
const redirectSchema = new Schema(
  {
    from: { type: String, required: true, unique: true, trim: true }, // e.g. /product/old-name
    to: { type: String, required: true, trim: true },
    permanent: { type: Boolean, default: true },
    auto: { type: Boolean, default: false }, // created by a slug change
    hits: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type RedirectDoc = InferSchemaType<typeof redirectSchema>;
if (models.Redirect) deleteModel('Redirect');
export const Redirect = model('Redirect', redirectSchema);
