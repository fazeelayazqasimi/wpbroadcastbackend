import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Package } from '../models/Package.js';
import { Company } from '../models/Company.js';
import { TargetList } from '../models/TargetList.js';
import { Contact } from '../models/Contact.js';
import { BroadcastLog } from '../models/BroadcastLog.js';
import { Template } from '../models/Template.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { superAdminMiddleware } from '../middleware/superadmin.js';

const router = Router();
router.use(authMiddleware);
router.use(superAdminMiddleware);

/* ── Packages ── */

router.get('/packages', async (_req: Request, res: Response) => {
  try {
    const packages = await Package.find().sort({ price: 1 });
    res.json(packages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

router.post('/packages', async (req: Request, res: Response) => {
  try {
    const pkg = await Package.create(req.body);
    res.status(201).json(pkg);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create package' });
  }
});

router.put('/packages/:id', async (req: Request, res: Response) => {
  try {
    const pkg = await Package.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!pkg) {
      res.status(404).json({ error: 'Package not found' });
      return;
    }
    res.json(pkg);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update package' });
  }
});

router.delete('/packages/:id', async (req: Request, res: Response) => {
  try {
    const companiesUsing = await Company.countDocuments({ packageId: req.params.id });
    if (companiesUsing > 0) {
      res.status(400).json({ error: `Cannot delete: ${companiesUsing} company(ies) use this package` });
      return;
    }
    const pkg = await Package.findByIdAndDelete(req.params.id);
    if (!pkg) {
      res.status(404).json({ error: 'Package not found' });
      return;
    }
    res.json({ message: 'Package deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete package' });
  }
});

/* ── Companies ── */

router.get('/companies', async (_req: Request, res: Response) => {
  try {
    const companies = await Company.find()
      .populate('packageId', 'name price credits durationDays')
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });
    const enriched = await Promise.all(
      companies.map(async (c) => {
        const userCount = await User.countDocuments({ companyId: c._id });
        const listCount = await TargetList.countDocuments({ companyId: c._id });
        return {
          ...c.toObject(),
          userCount,
          listCount,
        };
      })
    );
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

router.get('/companies/:id', async (req: Request, res: Response) => {
  try {
    const company = await Company.findById(req.params.id)
      .populate('packageId')
      .populate('createdBy', 'username email');
    if (!company) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }
    const userCount = await User.countDocuments({ companyId: company._id });
    const listCount = await TargetList.countDocuments({ companyId: company._id });
    const contactCount = await Contact.countDocuments({ companyId: company._id });
    const broadcastCount = await BroadcastLog.countDocuments({ companyId: company._id });
    const templateCount = await Template.countDocuments({ companyId: company._id });
    const users = await User.find({ companyId: company._id }).select('-password');
    res.json({
      ...company.toObject(),
      userCount,
      listCount,
      contactCount,
      broadcastCount,
      templateCount,
      users,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch company' });
  }
});

router.post('/companies', async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, phone, packageId, adminUsername, adminEmail, adminPassword } = req.body;
    if (!name || !packageId) {
      res.status(400).json({ error: 'Company name and package are required' });
      return;
    }
    const pkg = await Package.findById(packageId);
    if (!pkg) {
      res.status(400).json({ error: 'Invalid package' });
      return;
    }
    const existing = await Company.findOne({ email });
    if (existing) {
      res.status(400).json({ error: 'Company with this email already exists' });
      return;
    }
    const company = await Company.create({
      name,
      email: email || '',
      phone: phone || '',
      packageId,
      creditsRemaining: pkg.credits,
      createdBy: req.userId,
    });

    let adminUser = null;
    if (adminEmail && adminPassword) {
      const userExists = await User.findOne({ email: adminEmail });
      if (!userExists) {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        adminUser = await User.create({
          username: adminUsername || 'Company Admin',
          email: adminEmail,
          password: hashedPassword,
          role: 'Company Admin',
          isAdmin: true,
          companyId: company._id,
          permissions: ['dashboard', 'lists', 'compose', 'chat', 'admin'],
        });
        const { password: _, ...u } = adminUser.toObject();
        adminUser = u;
      }
    }

    res.status(201).json({ ...company.toObject(), adminUser });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create company' });
  }
});

router.put('/companies/:id', async (req: Request, res: Response) => {
  try {
    const allowed = [
      'name', 'email', 'phone', 'packageId', 'status', 'paymentStatus',
      'expiryDate', 'lastPaymentDate', 'notes',
      'whatsappAccessToken', 'whatsappPhoneNumberId',
      'whatsappBusinessAccountId', 'whatsappVerifyToken', 'whatsappApiVersion',
    ];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    if (req.body.addCredits) {
      const company = await Company.findById(req.params.id);
      if (company) {
        update.creditsRemaining = (company.creditsRemaining || 0) + Number(req.body.addCredits);
      }
    }
    const company = await Company.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('packageId', 'name credits');
    if (!company) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update company' });
  }
});

router.delete('/companies/:id', async (req: Request, res: Response) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }
    await User.deleteMany({ companyId: company._id });
    const lists = await TargetList.find({ companyId: company._id });
    const listIds = lists.map(l => l._id);
    await Contact.deleteMany({ listId: { $in: listIds } });
    await TargetList.deleteMany({ companyId: company._id });
    await BroadcastLog.deleteMany({ companyId: company._id });
    await Template.deleteMany({ companyId: company._id });
    await Company.findByIdAndDelete(company._id);
    res.json({ message: 'Company and all associated data deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete company' });
  }
});

/* ── Company Users (super admin manages) ── */

router.get('/companies/:id/users', async (req: Request, res: Response) => {
  try {
    const users = await User.find({ companyId: req.params.id }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch company users' });
  }
});

router.post('/companies/:id/users', async (req: AuthRequest, res: Response) => {
  try {
    const { username, email, password, role, isAdmin, permissions } = req.body;
    if (!username || !email || !password) {
      res.status(400).json({ error: 'Username, email, and password required' });
      return;
    }
    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role || 'Operator',
      isAdmin: isAdmin || false,
      companyId: req.params.id,
      permissions: permissions || ['dashboard', 'lists', 'compose'],
    });
    const { password: _, ...userWithoutPassword } = user.toObject();
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create company user' });
  }
});

/* ── Stats ── */

router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const totalCompanies = await Company.countDocuments();
    const activeCompanies = await Company.countDocuments({ status: 'active' });
    const inactiveCompanies = await Company.countDocuments({ status: 'inactive' });
    const suspendedCompanies = await Company.countDocuments({ status: 'suspended' });
    const totalPackages = await Package.countDocuments();
    const totalUsers = await User.countDocuments({ isSuperAdmin: { $ne: true } });
    const totalBroadcasts = await BroadcastLog.countDocuments();
    const totalLists = await TargetList.countDocuments();
    const totalContacts = await Contact.countDocuments();

    const companies = await Company.find().select('creditsRemaining creditsUsed');
    const totalCreditsIssued = companies.reduce((sum, c) => sum + (c.creditsRemaining || 0) + (c.creditsUsed || 0), 0);
    const totalCreditsUsed = companies.reduce((sum, c) => sum + (c.creditsUsed || 0), 0);
    const totalCreditsRemaining = companies.reduce((sum, c) => sum + (c.creditsRemaining || 0), 0);

    res.json({
      totalCompanies,
      activeCompanies,
      inactiveCompanies,
      suspendedCompanies,
      totalPackages,
      totalUsers,
      totalBroadcasts,
      totalLists,
      totalContacts,
      totalCreditsIssued,
      totalCreditsUsed,
      totalCreditsRemaining,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/* ── All system users (excluding super admins from list) ── */
router.get('/users', async (_req: AuthRequest, res: Response) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

export default router;
