import { Schema, deleteModel, model, models, type InferSchemaType } from 'mongoose';

const testimonialSchema = new Schema(
  {
    name: { type: String, required: true },
    location: { type: String, default: '' },
    quote: { type: String, required: true },
    rating: { type: Number, default: 5, min: 1, max: 5 },
  },
  { _id: false },
);

const hoursSchema = new Schema(
  { days: { type: String, required: true }, hours: { type: String, required: true } },
  { _id: false },
);

/** Singleton document holding site-wide business info. */
const settingsSchema = new Schema(
  {
    key: { type: String, default: 'site', unique: true },
    businessName: { type: String, default: 'Kalgi Handicraft' },
    tagline: { type: String, default: '' },
    ownerName: { type: String, default: '' },
    phone: { type: String, default: '' },
    whatsapp: { type: String, default: '' }, // digits incl. country code, e.g. 919876543210
    email: { type: String, default: '' },
    addressLine: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    country: { type: String, default: 'IN' },
    gstNumber: { type: String, default: '' },
    establishedYear: { type: Number, default: 1999 },
    rating: { type: Number, default: 4.5 },
    ratingCount: { type: Number, default: 0 },
    // Where the rating comes from (e.g. IndiaMART) and a link to the public reviews.
    ratingSource: { type: String, default: '' },
    ratingUrl: { type: String, default: '' },
    mapEmbedUrl: { type: String, default: '' },
    heroImage: { type: String, default: '' },
    aboutImage: { type: String, default: '' },
    hours: { type: [hoursSchema], default: [] },
    testimonials: { type: [testimonialSchema], default: [] },
    social: {
      instagram: { type: String, default: '' },
      facebook: { type: String, default: '' },
      youtube: { type: String, default: '' },
      indiamart: { type: String, default: '' },
    },
  },
  { timestamps: true },
);

export type SettingsDoc = InferSchemaType<typeof settingsSchema>;
// Re-register on hot reload so schema edits apply.
if (models.Settings) deleteModel('Settings');
export const Settings = model('Settings', settingsSchema);
