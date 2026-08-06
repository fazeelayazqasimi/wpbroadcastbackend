import { Router, Request, Response } from 'express';
import { BroadcastLog } from '../models/BroadcastLog.js';
import { Company } from '../models/Company.js';
import { Contact } from '../models/Contact.js';
import { TargetList } from '../models/TargetList.js';
import { sendWAMessage } from '../services/whatsapp.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permission.js';

const router = Router();
router.use(authMiddleware);
router.use(requirePermission('dashboard'));

const CONCURRENCY = 5;

function companyFilter(req: AuthRequest): Record<string, unknown> {
  if (req.isSuperAdmin) return {};
  if (req.companyId) return { companyId: req.companyId };
  return {};
}

async function mapWithConcurrency<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  let index = 0;
  const runner = async () => {
    while (index < items.length) {
      const current = items[index++];
      await worker(current);
    }
  };
  const workers = Array.from({ length: Math.min(limit, items.length) }, () => runner());
  await Promise.all(workers);
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const logs = await BroadcastLog.find(companyFilter(req)).sort({ dateTime: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch broadcast logs' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { listId, messageBody, listName } = req.body;
    if (!listId || !messageBody || !messageBody.trim()) {
      res.status(400).json({ error: 'List and message body are required' });
      return;
    }

    const filter: Record<string, unknown> = listId === '__all__'
      ? { status: 'Active', ...companyFilter(req) }
      : { listId, status: 'Active', ...companyFilter(req) };
    const contacts = await Contact.find(filter);

    if (contacts.length === 0) {
      res.status(400).json({ error: 'No active contacts found in the selected list' });
      return;
    }

    let companyCreds: { token: string; phoneId: string; apiVersion?: string } | undefined;
    if (req.companyId && !req.isSuperAdmin) {
      const company = await Company.findById(req.companyId);
      if (company?.whatsappAccessToken && company.whatsappPhoneNumberId) {
        companyCreds = {
          token: company.whatsappAccessToken,
          phoneId: company.whatsappPhoneNumberId,
          apiVersion: company.whatsappApiVersion,
        };
      }
    }

    let delivered = 0;
    let failed = 0;
    let firstError = '';
    const now = new Date().toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    const sentIds: string[] = [];
    const failedIds: string[] = [];

    await mapWithConcurrency(contacts, CONCURRENCY, async (contact) => {
      let body = messageBody
        .replace(/\{\{\s*Customer_Name\s*\}\}/gi, contact.name || '')
        .replace(/\{\{\s*Location\s*\}\}/gi, '')
        .replace(/\{\{\s*Schedule_Time\s*\}\}/gi, '');
      try {
        await sendWAMessage(contact.phone, body, companyCreds);
        delivered += 1;
        sentIds.push(contact._id.toString());
      } catch (err: any) {
        failed += 1;
        failedIds.push(contact._id.toString());
        if (!firstError) firstError = err?.message || 'WhatsApp send failed';
      }
    });

    const totalSent = contacts.length;

    if (failed === totalSent && firstError && firstError.includes('not configured')) {
      res.status(400).json({
        error: 'WhatsApp credentials not configured for this company. Add them in Admin → My Company Settings.',
      });
      return;
    }

    const status: 'Delivered' | 'Failed' = failed === totalSent ? 'Failed' : 'Delivered';

    const data: Record<string, unknown> = {
      listName: listName || `List (${totalSent} recipients)`,
      totalSent,
      delivered,
      failed,
      status,
      dateTime: now,
    };
    if (req.companyId && !req.isSuperAdmin) {
      data.companyId = req.companyId;
      const company = await Company.findById(req.companyId);
      if (company) {
        const cost = totalSent;
        const remaining = (company.creditsRemaining || 0) - cost;
        await Company.findByIdAndUpdate(req.companyId, {
          creditsRemaining: Math.max(0, remaining),
          creditsUsed: (company.creditsUsed || 0) + Math.min(cost, company.creditsRemaining || 0),
        });
      }
    }

    if (sentIds.length > 0) {
      await Contact.updateMany(
        { _id: { $in: sentIds }, ...companyFilter(req) },
        { lastBroadcast: now }
      );
    }
    if (listId !== '__all__') {
      await TargetList.findByIdAndUpdate(listId, { lastSent: now });
    }

    const log = await BroadcastLog.create(data);
    if (failed > 0 && firstError) {
      res.status(201).json({ log, firstError });
    } else {
      res.status(201).json({ log });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to send broadcast', detail: (error as Error)?.message });
  }
});

export default router;
