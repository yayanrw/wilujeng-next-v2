import { sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { accounts, users } from '@/db/schema';
import { hashPassword } from 'better-auth/crypto';
import { badRequest, json, readJson } from '@/server/api-helpers';

const Schema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email().max(120),
  password: z.string().min(8).max(200),
});

export async function POST(req: Request) {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users);

  if ((count ?? 0) > 0) {
    return badRequest('Setup is already complete');
  }

  const { data, error } = await readJson<unknown>(req);
  if (error || !data) return badRequest('Invalid JSON');
  const parsed = Schema.safeParse(data);
  if (!parsed.success) return badRequest(parsed.error.message);

  const hashedPassword = await hashPassword(parsed.data.password);
  const userId = crypto.randomUUID().replace(/-/g, '');

  await db.transaction(async (tx) => {
    await tx.insert(users).values({
      id: userId,
      email: parsed.data.email,
      name: parsed.data.name,
      role: 'admin',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await tx.insert(accounts).values({
      id: crypto.randomUUID().replace(/-/g, ''),
      userId: userId,
      type: 'email',
      providerId: 'credential',
      accountId: parsed.data.email,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  return json({ created: true });
}
