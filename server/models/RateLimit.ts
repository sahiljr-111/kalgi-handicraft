import { Schema, deleteModel, model, models } from 'mongoose';

const rateLimitSchema = new Schema({
  _id: { type: String, required: true }, // "<bucket>:<ip>"
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
});

// MongoDB removes documents once expiresAt passes.
rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

if (models.RateLimit) deleteModel('RateLimit');
export const RateLimit = model('RateLimit', rateLimitSchema);
