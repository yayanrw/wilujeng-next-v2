import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './src/db/schema';
import 'dotenv/config';

const client = postgres(process.env.DATABASE_URL as string);
const db = drizzle(client, { schema });

async function test() {
  try {
    const [user] = await db.insert(schema.users).values({
      id: crypto.randomUUID(),
      email: 'test' + Date.now() + '@example.com',
      name: 'Test User',
      role: 'cashier',
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    console.log('Inserted user:', user);
    console.log('Type of createdAt:', typeof user.createdAt);
    console.log('Is Date?', user.createdAt instanceof Date);
    
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

test();