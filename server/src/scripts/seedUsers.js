import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { connectDB, disconnectDB } from '../config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const users = [
  { email: 'alice@example.com', password: 'password123', name: 'Alice' },
  { email: 'bob@example.com', password: 'password123', name: 'Bob' },
];

async function seed() {
  await connectDB();

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
  await disconnectDB();
  console.log('Done.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
