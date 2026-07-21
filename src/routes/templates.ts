import { Router, Request, Response } from 'express';
import { Template } from '../models/Template.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', async (_req: Request, res: Response) => {
  try {
    const templates = await Template.find().sort({ createdAt: -1 });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, bodyText, isCurrent } = req.body;
    const template = await Template.create({ name, description, bodyText, isCurrent });
    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create template' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const template = await Template.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update template' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const template = await Template.findByIdAndDelete(req.params.id);
    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }
    res.json({ message: 'Template deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

export default router;
