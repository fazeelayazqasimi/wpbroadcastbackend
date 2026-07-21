import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permission.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { Contact } from '../models/Contact.js';
import { sendWAMessage, verifyWebhook, parseWebhookPayload } from '../services/whatsapp.js';

const router = Router();

router.get('/webhook', async (req: Request, res: Response) => {
  const mode = req.query['hub.mode'] as string;
  const token = req.query['hub.verify_token'] as string;
  const challenge = req.query['hub.challenge'] as string;

  const result = await verifyWebhook(mode, token, challenge);
  if (result) {
    res.status(200).send(result);
  } else {
    res.status(403).send('Verification failed');
  }
});

router.post('/webhook', async (req: Request, res: Response) => {
  const payload = parseWebhookPayload(req.body);

  if (!payload) {
    res.sendStatus(200);
    return;
  }

  try {
    let conversation = await Conversation.findOne({ phoneNumber: payload.from });

    if (!conversation) {
      const contact = await Contact.findOne({ phone: { $regex: payload.from.replace(/[^0-9]/g, '') } });
      conversation = await Conversation.create({
        phoneNumber: payload.from,
        contactName: contact?.name || payload.from,
        contactId: contact?._id,
        status: 'active',
      });
    }

    await Message.create({
      conversationId: conversation._id,
      from: 'contact',
      body: payload.msgBody,
      waMessageId: payload.waMessageId,
      direction: 'inbound',
      status: 'delivered',
    });

    conversation.lastMessage = payload.msgBody;
    conversation.lastMessageAt = new Date();
    conversation.lastDirection = 'received';
    conversation.unreadCount = (conversation.unreadCount || 0) + 1;
    await conversation.save();
  } catch { /* log silently */ }

  res.sendStatus(200);
});

router.use(authMiddleware);
router.use(requirePermission('chat'));

router.get('/conversations', async (_req: Request, res: Response) => {
  try {
    const conversations = await Conversation.find({ status: 'active' })
      .sort({ lastMessageAt: -1 });
    res.json(conversations);
  } catch {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

router.get('/conversations/:id/messages', async (req: Request, res: Response) => {
  try {
    const messages = await Message.find({ conversationId: req.params.id })
      .sort({ createdAt: 1 });
    const conversation = await Conversation.findByIdAndUpdate(
      req.params.id,
      { unreadCount: 0 },
      { new: true }
    );
    res.json({ messages, conversation });
  } catch {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.post('/send', async (req: Request, res: Response) => {
  try {
    const { conversationId, body } = req.body;
    if (!conversationId || !body?.trim()) {
      res.status(400).json({ error: 'conversationId and body are required' });
      return;
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    let waMessageId: string | null = null;
    let msgStatus: 'sent' | 'failed' = 'sent';

    try {
      const result = await sendWAMessage(conversation.phoneNumber, body.trim());
      waMessageId = result.waMessageId;
    } catch {
      msgStatus = 'failed';
    }

    const message = await Message.create({
      conversationId: conversation._id,
      from: 'agent',
      body: body.trim(),
      waMessageId,
      direction: 'outbound',
      status: msgStatus,
    });

    conversation.lastMessage = body.trim();
    conversation.lastMessageAt = new Date();
    conversation.lastDirection = 'sent';
    await conversation.save();

    res.status(201).json({ message, waError: msgStatus === 'failed' });
  } catch {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

router.post('/start', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, contactName, contactId } = req.body;
    if (!phoneNumber) {
      res.status(400).json({ error: 'phoneNumber is required' });
      return;
    }

    const clean = phoneNumber.replace(/[^0-9]/g, '');
    let conversation = await Conversation.findOne({ phoneNumber: clean });

    if (!conversation) {
      conversation = await Conversation.create({
        phoneNumber: clean,
        contactName: contactName || clean,
        contactId: contactId || undefined,
      });
    }

    res.status(201).json(conversation);
  } catch {
    res.status(500).json({ error: 'Failed to start conversation' });
  }
});

router.get('/contacts', async (_req: Request, res: Response) => {
  try {
    const contacts = await Contact.find({ status: 'Active' })
      .select('name phone listId')
      .sort({ name: 1 });

    const grouped: Record<string, { name: string; phone: string; _id: string }[]> = {};
    for (const c of contacts) {
      const key = c.listId.toString();
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({ name: c.name, phone: c.phone, _id: c._id.toString() });
    }

    const existingConversations = await Conversation.find().select('phoneNumber');
    const existingPhones = new Set(existingConversations.map(c => c.phoneNumber));

    const result = Object.entries(grouped).map(([listId, listContacts]) => ({
      listId,
      contacts: listContacts.map(c => ({
        ...c,
        hasConversation: existingPhones.has(c.phone.replace(/[^0-9]/g, '')),
      })),
    }));

    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

export default router;
