import { z } from 'zod';
import { connectDB } from '../db';
import { Settings } from '../models';
import { revalidate } from '../revalidate';

export async function getSettings() {
  await connectDB();
  const existing = await Settings.findOne({ key: 'site' }).lean();
  if (existing) return existing;
  return (await Settings.create({ key: 'site' })).toObject();
}

const settingsInput = z.object({
  businessName: z.string().trim().min(2).max(120),
  tagline: z.string().trim().max(200).optional().default(''),
  ownerName: z.string().trim().max(120).optional().default(''),
  phone: z.string().trim().max(30).optional().default(''),
  whatsapp: z
    .string()
    .transform((v) => v.replace(/\D/g, ''))
    .refine((v) => v === '' || /^\d{10,15}$/.test(v), 'Include the country code, e.g. 919876543210'),
  email: z.union([z.literal(''), z.string().trim().email()]).optional().default(''),
  addressLine: z.string().trim().max(300).optional().default(''),
  city: z.string().trim().max(80).optional().default(''),
  state: z.string().trim().max(80).optional().default(''),
  postalCode: z.string().trim().max(20).optional().default(''),
  country: z.string().trim().max(2).optional().default('IN'),
  gstNumber: z.string().trim().max(20).optional().default(''),
  establishedYear: z.coerce.number().int().min(1900).max(2100),
  rating: z.coerce.number().min(0).max(5),
  ratingCount: z.coerce.number().int().min(0).optional().default(0),
  ratingSource: z.string().trim().max(60).optional().default(''),
  ratingUrl: z.union([z.literal(''), z.string().url()]).optional().default(''),
  mapEmbedUrl: z.union([z.literal(''), z.string().url()]).optional().default(''),
  heroImage: z.string().optional().default(''),
  aboutImage: z.string().optional().default(''),
  hours: z.array(z.object({ days: z.string().trim().min(1), hours: z.string().trim().min(1) })).max(10).default([]),
  testimonials: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        location: z.string().trim().optional().default(''),
        quote: z.string().trim().min(1),
        rating: z.coerce.number().min(1).max(5).default(5),
      }),
    )
    .max(20)
    .default([]),
  social: z
    .object({
      instagram: z.string().trim().optional().default(''),
      facebook: z.string().trim().optional().default(''),
      youtube: z.string().trim().optional().default(''),
      indiamart: z.string().trim().optional().default(''),
    })
    .optional()
    .default({ instagram: '', facebook: '', youtube: '', indiamart: '' }),
});

export async function updateSettings(input: unknown) {
  await connectDB();
  const data = settingsInput.parse(input);
  const settings = await Settings.findOneAndUpdate({ key: 'site' }, { $set: data }, { returnDocument: 'after', upsert: true }).lean();
  // Business info is in the header/footer of every page.
  revalidate({ tags: ['settings'], paths: ['/'] });
  return settings;
}
