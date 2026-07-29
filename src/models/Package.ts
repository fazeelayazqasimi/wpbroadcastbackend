import mongoose, { Schema, Document } from 'mongoose';

export interface IPackage extends Document {
  name: string;
  description: string;
  price: number;
  credits: number;
  maxUsers: number;
  maxLists: number;
  features: string[];
  durationDays: number;
  isActive: boolean;
}

const PackageSchema = new Schema<IPackage>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, default: 0 },
    credits: { type: Number, required: true, default: 100 },
    maxUsers: { type: Number, default: 5 },
    maxLists: { type: Number, default: 10 },
    features: { type: [String], default: [] },
    durationDays: { type: Number, default: 30 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Package = mongoose.model<IPackage>('Package', PackageSchema);
