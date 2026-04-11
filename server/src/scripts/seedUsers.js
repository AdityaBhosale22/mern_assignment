import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const users = [
  { email: 'alice@example.com', password: 'password123', name: 'Alice' },
  { email: 'bob@example.com', password: 'password123', name: 'Bob' },
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Set MONGODB_URI in server/.env');
    process.exit(1);
  }
  await mongoose.connect(uri);
  for (const u of users) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      console.log(`Skip existing user: ${u.email}`);
      continue;
    }
    const passwordHash = await bcrypt.hash(u.password, 12);
    await User.create({ email: u.email, passwordHash, name: u.name });
    console.log(`Created user: ${u.email}`);
  }
  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
