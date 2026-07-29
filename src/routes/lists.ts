import { Router, Request, Response } from 'express';
import { TargetList } from '../models/TargetList.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permission.js';

const router = Router();
router.use(authMiddleware);
router.use(requirePermission('lists'));

function companyFilter(req: AuthRequest): Record<string, unknown> {
  if (req.isSuperAdmin) return {};
  if (req.companyId) return { companyId: req.companyId };
  return {};
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const lists = await TargetList.find(companyFilter(req)).sort({ createdAt: -1 });
    res.json(lists);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lists' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const list = await TargetList.findOne({ _id: req.params.id, ...companyFilter(req) });
    if (!list) {
      res.status(404).json({ error: 'List not found' });
      return;
    }
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch list' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    const data: Record<string, unknown> = { name, description };
    if (req.companyId && !req.isSuperAdmin) data.companyId = req.companyId;
    const list = await TargetList.create(data);
    res.status(201).json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create list' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const list = await TargetList.findOneAndUpdate(
      { _id: req.params.id, ...companyFilter(req) },
      req.body,
      { new: true }
    );
    if (!list) {
      res.status(404).json({ error: 'List not found' });
      return;
    }
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update list' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const list = await TargetList.findOneAndDelete({ _id: req.params.id, ...companyFilter(req) });
    if (!list) {
      res.status(404).json({ error: 'List not found' });
      return;
    }
    res.json({ message: 'List deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete list' });
  }
});

export default router;
