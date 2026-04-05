import { POST } from './src/app/api/setup-admin/route';
import { db } from './src/db';
import { users, accounts } from './src/db/schema';
import { eq } from 'drizzle-orm';
import 'dotenv/config';

async function test() {
  console.log('Testing setup-admin...');

  // 1. Delete all users to simulate "no users"
  await db.delete(accounts);
  await db.delete(users);

  // 2. Call the POST handler directly
  const req = new Request('http://localhost/api/setup-admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Admin',
      email: 'testadmin@example.com',
      password: 'password123',
    }),
  });

  try {
    const res = await POST(req);
    console.log('Status:', res.status);
    console.log('Headers:', Object.fromEntries(res.headers.entries()));
    const body = await res.json();
    console.log('Body:', body);

    const userCount = await db.select().from(users);
    console.log('Users in DB after:', userCount);
  } catch (e) {
    console.error('Error during POST:', e);
  }

  process.exit(0);
}

test();