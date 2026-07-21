import { Router, Request, Response } from 'express';
import { BroadcastLog } from '../models/BroadcastLog.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', async (_req: Request, res: Response) => {
  try {
    const logs = await BroadcastLog.find().sort({ dateTime: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch broadcast logs' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { listName, totalSent, delivered, failed, status, dateTime } = req.body;
    const log = await BroadcastLog.create({
      listName,
      totalSent,
      delivered,
      failed,
      status,
      dateTime,
    });
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create broadcast log' });
  }
});

export default router;
