import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  from: 'agent' | 'contact';
  body: string;
  waMessageId?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  direction: 'outbound' | 'inbound';
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    from: { type: String, enum: ['agent', 'contact'], required: true },
    body: { type: String, required: true },
    waMessageId: { type: String },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read', 'failed'],
      default: 'sent',
    },
    direction: { type: String, enum: ['outbound', 'inbound'], required: true },
  },
  { timestamps: true }
);

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
