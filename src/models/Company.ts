import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICompany extends Document {
  name: string;
  email: string;
  phone: string;
  packageId: Types.ObjectId;
  creditsRemaining: number;
  creditsUsed: number;
  status: 'active' | 'inactive' | 'suspended';
  paymentStatus: 'paid' | 'unpaid' | 'partial';
  expiryDate: Date | null;
  lastPaymentDate: Date | null;
  notes: string;
  createdBy: Types.ObjectId;
  whatsappAccessToken: string;
  whatsappPhoneNumberId: string;
  whatsappBusinessAccountId: string;
  whatsappVerifyToken: string;
  whatsappApiVersion: string;
}

const CompanySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, default: '' },
    packageId: { type: Schema.Types.ObjectId, ref: 'Package', required: true },
    creditsRemaining: { type: Number, default: 0 },
    creditsUsed: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
    paymentStatus: { type: String, enum: ['paid', 'unpaid', 'partial'], default: 'unpaid' },
    expiryDate: { type: Date, default: null },
    lastPaymentDate: { type: Date, default: null },
    notes: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    whatsappAccessToken: { type: String, default: '' },
    whatsappPhoneNumberId: { type: String, default: '' },
    whatsappBusinessAccountId: { type: String, default: '' },
    whatsappVerifyToken: { type: String, default: 'broadcast_verify' },
    whatsappApiVersion: { type: String, default: 'v22.0' },
  },
  { timestamps: true }
);

export const Company = mongoose.model<ICompany>('Company', CompanySchema);
