import mongoose, { Schema, Document } from 'mongoose';

export interface IContact extends Document {
  listId: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  status: 'Active' | 'Opted-out';
  lastBroadcast: string;
}

const ContactSchema = new Schema<IContact>(
  {
    listId: { type: Schema.Types.ObjectId, ref: 'TargetList', required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    status: {
      type: String,
      enum: ['Active', 'Opted-out'],
      default: 'Active',
    },
    lastBroadcast: { type: String, default: 'Never' },
  },
  { timestamps: true }
);

export const Contact = mongoose.model<IContact>('Contact', ContactSchema);
