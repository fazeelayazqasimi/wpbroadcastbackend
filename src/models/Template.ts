import mongoose, { Schema, Document } from 'mongoose';

export interface ITemplate extends Document {
  name: string;
  description: string;
  bodyText: string;
  isCurrent: boolean;
}

const TemplateSchema = new Schema<ITemplate>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    bodyText: { type: String, required: true },
    isCurrent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Template = mongoose.model<ITemplate>('Template', TemplateSchema);
