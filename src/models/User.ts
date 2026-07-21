import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: string;
  avatarUrl: string;
  isAdmin: boolean;
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
    permissions: { type: [String], default: ['dashboard', 'lists', 'compose'] },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
