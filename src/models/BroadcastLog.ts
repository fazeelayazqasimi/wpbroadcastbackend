import mongoose, { Schema, Document } from 'mongoose';

export interface IBroadcastLog extends Document {
  listName: string;
  totalSent: number;
  delivered: number;
  failed: number;
  status: 'Delivered' | 'Pending' | 'Failed';
  dateTime: string;
}

const BroadcastLogSchema = new Schema<IBroadcastLog>(
  {
    listName: { type: String, required: true },
    totalSent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Delivered', 'Pending', 'Failed'],
      default: 'Pending',
    },
    dateTime: { type: String, required: true },
  },
  { timestamps: true }
);

export const BroadcastLog = mongoose.model<IBroadcastLog>('BroadcastLog', BroadcastLogSchema);
