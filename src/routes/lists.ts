import { Router, Request, Response } from 'express';
import { TargetList } from '../models/TargetList.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', async (_req: Request, res: Response) => {
  try {
    const lists = await TargetList.find().sort({ createdAt: -1 });
    res.json(lists);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lists' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const list = await TargetList.findById(req.params.id);
    if (!list) {
      res.status(404).json({ error: 'List not found' });
      return;
    }
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch list' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const list = await TargetList.create({ name, description });
    res.status(201).json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create list' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const list = await TargetList.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
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
    const list = await TargetList.findByIdAndDelete(req.params.id);
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
