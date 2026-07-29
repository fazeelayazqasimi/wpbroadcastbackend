import { Router, Request, Response } from 'express';
import { Template } from '../models/Template.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permission.js';

const router = Router();
router.use(authMiddleware);
router.use(requirePermission('compose'));

function companyFilter(req: AuthRequest): Record<string, unknown> {
  if (req.isSuperAdmin) return {};
  if (req.companyId) return { companyId: req.companyId };
  return {};
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const templates = await Template.find(companyFilter(req)).sort({ createdAt: -1 });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, bodyText, isCurrent } = req.body;
    const data: Record<string, unknown> = { name, description, bodyText, isCurrent };
    if (req.companyId && !req.isSuperAdmin) data.companyId = req.companyId;
    const template = await Template.create(data);
    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create template' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const template = await Template.findOneAndUpdate(
      { _id: req.params.id, ...companyFilter(req) },
      req.body,
      { new: true }
    );
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
    const template = await Template.findOneAndDelete({ _id: req.params.id, ...companyFilter(req) });
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
