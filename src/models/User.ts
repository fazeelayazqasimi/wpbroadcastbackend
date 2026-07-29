import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: string;
  avatarUrl: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  companyId: Types.ObjectId | null;
  permissions: string[];
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, default: 'Operator' },
    avatarUrl: { type: String, default: '' },
    isAdmin: { type: Boolean, default: false },
    isSuperAdmin: { type: Boolean, default: false },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', default: null },
    permissions: { type: [String], default: ['dashboard', 'lists', 'compose'] },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
