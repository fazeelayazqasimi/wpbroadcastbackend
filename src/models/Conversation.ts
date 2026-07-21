import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
  phoneNumber: string;
  contactName: string;
  contactId?: mongoose.Types.ObjectId;
  lastMessage: string;
  lastMessageAt: Date;
  lastDirection: 'sent' | 'received';
  unreadCount: number;
  assignedTo?: string;
  status: 'active' | 'archived';
}

const ConversationSchema = new Schema<IConversation>(
  {
    phoneNumber: { type: String, required: true, unique: true },
    contactName: { type: String, required: true },
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact' },
    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date, default: Date.now },
    lastDirection: { type: String, enum: ['sent', 'received'], default: 'sent' },
    unreadCount: { type: Number, default: 0 },
    assignedTo: { type: String },
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
  },
  { timestamps: true }
);

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);
