import { Schema, deleteModel, model, models, type InferSchemaType } from 'mongoose';

export const ROLES = ['owner', 'staff'] as const;
export type Role = (typeof ROLES)[number];

const userSchema = new Schema(
  {
    name: { type: String, default: '' },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: 'staff' },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema>;
// Re-register on hot reload so schema edits apply.
if (models.User) deleteModel('User');
export const User = model('User', userSchema);
