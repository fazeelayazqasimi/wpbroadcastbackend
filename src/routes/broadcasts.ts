import { Router, Request, Response } from 'express';
import { BroadcastLog } from '../models/BroadcastLog.js';
import { Company } from '../models/Company.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permission.js';

const router = Router();
router.use(authMiddleware);
router.use(requirePermission('dashboard'));

function companyFilter(req: AuthRequest): Record<string, unknown> {
  if (req.isSuperAdmin) return {};
  if (req.companyId) return { companyId: req.companyId };
  return {};
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
    const { listName, totalSent, delivered, failed, status, dateTime } = req.body;
    const data: Record<string, unknown> = { listName, totalSent, delivered, failed, status, dateTime };
    if (req.companyId && !req.isSuperAdmin) {
      data.companyId = req.companyId;
      const company = await Company.findById(req.companyId);
      if (company) {
        const cost = Number(totalSent) || 0;
        const remaining = (company.creditsRemaining || 0) - cost;
        await Company.findByIdAndUpdate(req.companyId, {
          creditsRemaining: Math.max(0, remaining),
          creditsUsed: (company.creditsUsed || 0) + Math.min(cost, company.creditsRemaining || 0),
        });
      }
    }
    const log = await BroadcastLog.create(data);
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create broadcast log' });
  }
});

export default router;
