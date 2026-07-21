import 'dotenv/config';
import { connectDB } from './config/db.js';
import { User } from './models/User.js';
import { Setting } from './models/Setting.js';
import bcrypt from 'bcrypt';

async function migrate() {
  await connectDB();

  const result = await User.updateMany(
    { isAdmin: { $exists: false } },
    { $set: { isAdmin: true, permissions: ['dashboard', 'lists', 'compose', 'admin'] } }
  );
  console.log('Updated users without isAdmin field:', result.modifiedCount);

  const adminUser = await User.findOne({ email: 'admin@broadcast.com' });
  if (adminUser && !adminUser.isAdmin) {
    adminUser.isAdmin = true;
    adminUser.permissions = ['dashboard', 'lists', 'compose', 'admin'];
    await adminUser.save();
    console.log('Admin user updated');
  }

  const existingSettings = await Setting.findOne({ key: 'WHATSAPP_ACCESS_TOKEN' });
  if (!existingSettings) {
    await Setting.create([
      { key: 'WHATSAPP_ACCESS_TOKEN', value: '', description: 'WhatsApp Cloud API - Permanent Access Token', category: 'api' },
      { key: 'WHATSAPP_PHONE_NUMBER_ID', value: '', description: 'WhatsApp Cloud API - Phone Number ID', category: 'api' },
      { key: 'WHATSAPP_BUSINESS_ACCOUNT_ID', value: '', description: 'WhatsApp Cloud API - WABA ID', category: 'api' },
      { key: 'META_APP_ID', value: '', description: 'Meta App ID from Facebook Developers Console', category: 'meta' },
      { key: 'META_APP_SECRET', value: '', description: 'Meta App Secret from Facebook Developers Console', category: 'meta' },
      { key: 'GEMINI_API_KEY', value: '', description: 'Google Gemini AI API Key for AI features', category: 'api' },
      { key: 'WHATSAPP_API_VERSION', value: 'v22.0', description: 'WhatsApp Cloud API Version', category: 'api' },
      {
        key: 'GUIDE_WHATSAPP_TOKEN',
        value: '1. Go to https://developers.facebook.com/\n2. Create a Meta App or select your existing app\n3. Go to WhatsApp > Getting Started\n4. Copy your Phone Number ID\n5. Generate a Permanent Access Token\n6. Copy the Token here',
        description: 'Step-by-step guide for WhatsApp Access Token',
        category: 'guide',
      },
      {
        key: 'GUIDE_META_APP',
        value: '1. Go to https://developers.facebook.com/\n2. Create a new App or select existing\n3. Go to Settings > Basic\n4. Copy App ID and App Secret\n5. Add them in Meta Settings above',
        description: 'Step-by-step guide for Meta App credentials',
        category: 'guide',
      },
      {
        key: 'GUIDE_GEMINI',
        value: '1. Go to https://aistudio.google.com/\n2. Click "Get API Key" in left sidebar\n3. Create a new API key\n4. Copy and paste it here',
        description: 'Step-by-step guide for Gemini API Key',
        category: 'guide',
      },
    ]);
    console.log('Default settings created');
  } else {
    console.log('Settings already exist, skipping');
  }

  console.log('Migration completed');
  process.exit(0);
}

migrate();
