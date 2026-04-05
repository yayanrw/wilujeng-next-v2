import { asc, desc, eq, ilike, or } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { accounts, users } from '@/db/schema';
import { hashPassword } from 'better-auth/crypto';
import {
  badRequest,
  json,
  readJson,
  requireApiRole,
} from '@/server/api-helpers';

export async function GET(req: Request) {
  const { response } = await requireApiRole(req, 'admin');
  if (response) return response;

  const url = new URL(req.url);
  const search = url.searchParams.get('search') || '';
  const limit = Math.min(
    parseInt(url.searchParams.get('limit') || '20', 10),
    100,
  );
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  const filters = search
    ? or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`))
    : undefined;

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(filters)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);

  return json(rows);
}

const CreateSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email().max(120),
  password: z.string().min(8).max(200),
  role: z.enum(['admin', 'cashier']).default('cashier'),
});

export async function POST(req: Request) {
  const { response } = await requireApiRole(req, 'admin');
  if (response) return response;

  const { data, error } = await readJson<unknown>(req);
  if (error || !data) return badRequest('Invalid JSON');
  const parsed = CreateSchema.safeParse(data);
  if (!parsed.success) return badRequest(parsed.error.message);

  const existing = await db.query.users.findFirst({
    where: (t, { eq: eq2 }) => eq2(t.email, parsed.data.email),
  });
  if (existing) return badRequest('User already exists');

  const hashedPassword = await hashPassword(parsed.data.password);
  const userId = crypto.randomUUID().replace(/-/g, '');

  await db.transaction(async (tx) => {
    await tx.insert(users).values({
      id: userId,
      email: parsed.data.email,
      name: parsed.data.name,
      role: parsed.data.role,
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

  return json({ id: userId }, { status: 201 });
}
