import 'dotenv/config';
import { connectDB } from './config/db.js';
import { User } from './models/User.js';
import { Setting } from './models/Setting.js';

async function migrate() {
  await connectDB();

  const admin = await User.findOne({ email: 'admin@broadcast.com' });
  if (admin) {
    const perms = admin.permissions || [];
    if (!perms.includes('chat')) {
      admin.permissions = [...perms, 'chat'];
      await admin.save();
      console.log('Added chat permission to admin user');
    } else {
      console.log('Admin already has chat permission');
    }
  }

  const missingSettings = [
    { key: 'WHATSAPP_VERIFY_TOKEN', value: 'broadcast_verify', description: 'WhatsApp Webhook Verify Token', category: 'api' },
  ];

  for (const s of missingSettings) {
    const existing = await Setting.findOne({ key: s.key });
    if (!existing) {
      await Setting.create(s);
      console.log(`Created setting: ${s.key}`);
    }
  }

  console.log('Migration complete');
  process.exit(0);
}

migrate();
