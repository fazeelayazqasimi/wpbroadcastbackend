import 'dotenv/config';
import { connectDB } from './config/db.js';
import { User } from './models/User.js';
import { Package } from './models/Package.js';
import { Setting } from './models/Setting.js';
import { Template } from './models/Template.js';
import { TargetList } from './models/TargetList.js';
import { Contact } from './models/Contact.js';
import bcrypt from 'bcryptjs';

async function seed() {
  await connectDB();

  const existingSettings = await Setting.findOne({ key: 'WHATSAPP_ACCESS_TOKEN' });
  if (existingSettings) {
    console.log('Seed data already exists, skipping.');
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const existingUser = await User.findOne({ email: 'admin@broadcast.com' });
  if (!existingUser) {
    await User.create({
      username: 'Super Admin',
      email: 'admin@broadcast.com',
      password: hashedPassword,
      role: 'Super Admin',
      avatarUrl: '',
      isAdmin: true,
      isSuperAdmin: true,
      permissions: ['dashboard', 'lists', 'compose', 'admin', 'chat'],
    });
    console.log('Created super admin user (admin@broadcast.com / admin123)');
  } else {
    console.log('Admin user already exists, skipping.');
  }

  /* ── Packages ── */
  const existingPackages = await Package.countDocuments();
  if (existingPackages === 0) {
    await Package.create([
      {
        name: 'Basic',
        description: 'Starter package for small teams. Includes 500 credits, 3 users, and 5 lists.',
        price: 0,
        credits: 500,
        maxUsers: 3,
        maxLists: 5,
        features: ['dashboard', 'lists', 'compose'],
        durationDays: 30,
        isActive: true,
      },
      {
        name: 'Professional',
        description: 'Best for growing businesses. Includes 2500 credits, 10 users, and 20 lists.',
        price: 99,
        credits: 2500,
        maxUsers: 10,
        maxLists: 20,
        features: ['dashboard', 'lists', 'compose', 'chat'],
        durationDays: 30,
        isActive: true,
      },
      {
        name: 'Enterprise',
        description: 'Unlimited credits, users, and lists with priority support and all features.',
        price: 299,
        credits: 10000,
        maxUsers: 999,
        maxLists: 999,
        features: ['dashboard', 'lists', 'compose', 'chat', 'admin'],
        durationDays: 30,
        isActive: true,
      },
    ]);
    console.log('Created 3 packages (Basic, Professional, Enterprise)');
  } else {
    console.log('Packages already exist, skipping.');
  }

  await Setting.create([
    {
      key: 'WHATSAPP_ACCESS_TOKEN',
      value: '',
      description: 'WhatsApp Cloud API - Permanent Access Token',
      category: 'api',
    },
    {
      key: 'WHATSAPP_PHONE_NUMBER_ID',
      value: '',
      description: 'WhatsApp Cloud API - Phone Number ID',
      category: 'api',
    },
    {
      key: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
      value: '',
      description: 'WhatsApp Cloud API - WABA ID',
      category: 'api',
    },
    {
      key: 'WHATSAPP_VERIFY_TOKEN',
      value: 'broadcast_verify',
      description: 'WhatsApp Webhook Verify Token',
      category: 'api',
    },
    {
      key: 'META_APP_ID',
      value: '',
      description: 'Meta App ID from Facebook Developers Console',
      category: 'meta',
    },
    {
      key: 'META_APP_SECRET',
      value: '',
      description: 'Meta App Secret from Facebook Developers Console',
      category: 'meta',
    },
    {
      key: 'GEMINI_API_KEY',
      value: '',
      description: 'Google Gemini AI API Key for AI features',
      category: 'api',
    },
    {
      key: 'WHATSAPP_API_VERSION',
      value: 'v22.0',
      description: 'WhatsApp Cloud API Version',
      category: 'api',
    },
    {
      key: 'GUIDE_WHATSAPP_TOKEN',
      value: `1. Go to https://developers.facebook.com/\n2. Create a Meta App or select your existing app\n3. Go to WhatsApp > Getting Started\n4. Copy your Phone Number ID\n5. Generate a Permanent Access Token\n6. Copy the Token here`,
      description: 'Step-by-step guide for WhatsApp Access Token',
      category: 'guide',
    },
    {
      key: 'GUIDE_META_APP',
      value: `1. Go to https://developers.facebook.com/\n2. Create a new App or select existing\n3. Go to Settings > Basic\n4. Copy App ID and App Secret\n5. Add them in Meta Settings above`,
      description: 'Step-by-step guide for Meta App credentials',
      category: 'guide',
    },
    {
      key: 'GUIDE_GEMINI',
      value: `1. Go to https://aistudio.google.com/\n2. Click "Get API Key" in left sidebar\n3. Create a new API key\n4. Copy and paste it here`,
      description: 'Step-by-step guide for Gemini API Key',
      category: 'guide',
    },
  ]);

  console.log('Created default settings');

  const template1 = await Template.create({
    name: 'Maintenance Alert',
    description: 'Scheduled work notification',
    bodyText: `*Maintenance Notification*\n\nDear {{Customer_Name}},\n\nPlease be informed of scheduled maintenance in {{Location}} on {{Schedule_Time}}.\n\nRegards,\nService Team`,
    isCurrent: true,
  });

  const template2 = await Template.create({
    name: 'Payment Reminder',
    description: 'Standard reminder for outstanding balances',
    bodyText: `*Payment Reminder*\n\nDear {{Customer_Name}},\n\nYour payment for {{Location}} is due on {{Schedule_Time}}. Please clear your dues.\n\nRegards,\nBilling Dept`,
    isCurrent: false,
  });

  console.log('Created templates');

  const list1 = await TargetList.create({
    name: 'Primary Residential Sector',
    description: 'Main residential contact list',
    contactCount: 0,
    status: 'Active',
    lastSent: 'Never',
  });

  const list2 = await TargetList.create({
    name: 'Commercial Clients',
    description: 'Business and corporate clients',
    contactCount: 0,
    status: 'Active',
    lastSent: 'Never',
  });

  console.log('Created target lists');

  await Contact.create([
    { listId: list1._id, name: 'Ahmed Ali', phone: '+92 300 1234567', status: 'Active', lastBroadcast: 'Never' },
    { listId: list1._id, name: 'Sara Malik', phone: '+92 345 5556677', status: 'Active', lastBroadcast: 'Never' },
    { listId: list1._id, name: 'Muhammad Rizwan', phone: '+92 312 4443322', status: 'Active', lastBroadcast: 'Never' },
    { listId: list2._id, name: 'Adnan Qureshi', phone: '+92 300 1112222', status: 'Active', lastBroadcast: 'Never' },
    { listId: list2._id, name: 'Zainab Khan', phone: '+92 321 9876543', status: 'Active', lastBroadcast: 'Never' },
  ]);

  await TargetList.findByIdAndUpdate(list1._id, { contactCount: 3 });
  await TargetList.findByIdAndUpdate(list2._id, { contactCount: 2 });

  console.log('Created contacts');
  console.log('Seed completed successfully');
  process.exit(0);
}

seed();
