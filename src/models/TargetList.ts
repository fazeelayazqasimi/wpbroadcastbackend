import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITargetList extends Document {
  name: string;
  description: string;
  contactCount: number;
  status: 'Active' | 'Verified' | 'Draft' | 'Priority';
  lastSent: string;
  companyId: Types.ObjectId | null;
}

const TargetListSchema = new Schema<ITargetList>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    contactCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Active', 'Verified', 'Draft', 'Priority'],
      default: 'Active',
    },
    lastSent: { type: String, default: 'Never' },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', default: null },
  },
  { timestamps: true }
);

export const TargetList = mongoose.model<ITargetList>('TargetList', TargetListSchema);
