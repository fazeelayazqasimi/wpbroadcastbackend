import mongoose, { Schema, Document } from 'mongoose';

export interface ISetting extends Document {
  key: string;
  value: string;
  description: string;
  category: 'api' | 'meta' | 'general' | 'guide';
}

const SettingSchema = new Schema<ISetting>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: String, default: '' },
    description: { type: String, default: '' },
    category: { type: String, enum: ['api', 'meta', 'general', 'guide'], default: 'general' },
  },
  { timestamps: true }
);

export const Setting = mongoose.model<ISetting>('Setting', SettingSchema);
