import 'dotenv/config';
import { connectDB } from './config/db.js';
import { Conversation } from './models/Conversation.js';

async function run() {
  await connectDB();
  const indexes = await Conversation.collection.indexes();
  console.log('Current indexes:', indexes.map(i => i.name).join(', '));
  const uniqueIdx = indexes.find(i => i.unique);
  if (uniqueIdx?.name) {
    await Conversation.collection.dropIndex(uniqueIdx.name);
    console.log(`Dropped unique index: ${uniqueIdx.name}`);
  } else {
    console.log('No unique index found, nothing to drop');
  }
  const del = await Conversation.deleteMany({ companyId: null, lastMessage: '' });
  console.log(`Removed ${del.deletedCount} orphaned test conversations`);
  process.exit(0);
}

run();
