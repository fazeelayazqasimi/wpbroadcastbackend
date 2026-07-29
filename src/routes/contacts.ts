import { Router, Request, Response } from 'express';
import { Contact } from '../models/Contact.js';
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

router.get('/list/:listId', async (req: Request, res: Response) => {
  try {
    const contacts = await Contact.find({ listId: req.params.listId, ...companyFilter(req) });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { listId, name, phone } = req.body;
    const data: Record<string, unknown> = { listId, name, phone };
    if (req.companyId && !req.isSuperAdmin) data.companyId = req.companyId;
    const contact = await Contact.create(data);
    const count = await Contact.countDocuments({ listId });
    await TargetList.findByIdAndUpdate(listId, { contactCount: count });
    res.status(201).json(contact);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

router.post('/bulk', async (req: AuthRequest, res: Response) => {
  try {
    const { listId, contacts } = req.body;
    const companyId = (!req.isSuperAdmin && req.companyId) ? req.companyId : null;
    const created = await Contact.insertMany(
      contacts.map((c: { name: string; phone: string }) => ({
        listId,
        name: c.name,
        phone: c.phone,
        ...(companyId ? { companyId } : {}),
      }))
    );
    const count = await Contact.countDocuments({ listId });
    await TargetList.findByIdAndUpdate(listId, { contactCount: count });
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk import contacts' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, ...companyFilter(req) },
      req.body,
      { new: true }
    );
    if (!contact) {
      res.status(404).json({ error: 'Contact not found' });
      return;
    }
    res.json(contact);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const contact = await Contact.findOneAndDelete({ _id: req.params.id, ...companyFilter(req) });
    if (!contact) {
      res.status(404).json({ error: 'Contact not found' });
      return;
    }
    const count = await Contact.countDocuments({ listId: contact.listId });
    await TargetList.findByIdAndUpdate(contact.listId, { contactCount: count });
    res.json({ message: 'Contact deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

export default router;
