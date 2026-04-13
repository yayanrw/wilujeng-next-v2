import { asc, eq, ilike } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { suppliers, stockLogs } from '@/db/schema';
import {
  badRequest,
  json,
  readJson,
  requireApiSession,
  requireApiRole,
  notFound,
} from '@/server/api-helpers';
import {
  getCachedData,
  setCachedData,
  invalidateCachePattern,
} from '@/lib/redis';

export async function GET(req: Request) {
  const { response } = await requireApiSession(req);
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const search = (searchParams.get('search') ?? '').trim();

  const cacheKey = `suppliers:list:${search || 'all'}`;
  const cachedData = await getCachedData(cacheKey);

  if (cachedData) {
    return json(cachedData);
  }

  const rows = await db
    .select({
      id: suppliers.id,
      name: suppliers.name,
      phone: suppliers.phone,
      address: suppliers.address,
    })
    .from(suppliers)
    .where(search ? ilike(suppliers.name, `%${search}%`) : undefined)
    .orderBy(asc(suppliers.name))
    .limit(50);

  await setCachedData(cacheKey, rows);
  return json(rows);
}

const CreateSchema = z.object({
  name: z.string().min(1).max(80),
  phone: z.string().max(80).optional(),
  address: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  const { response } = await requireApiSession(req);
  if (response) return response;

  const { data, error } = await readJson<unknown>(req);
  if (error || !data) return badRequest('Invalid JSON');
  const parsed = CreateSchema.safeParse(data);
  if (!parsed.success) return badRequest(parsed.error.message);

  const [row] = await db
    .insert(suppliers)
    .values({
      name: parsed.data.name,
      phone: parsed.data.phone,
      address: parsed.data.address,
    })
    .onConflictDoNothing()
    .returning();

  if (!row) {
    const existing = await db.query.suppliers.findFirst({
      where: (t, { eq }) => eq(t.name, parsed.data.name),
    });
    if (!existing) return badRequest('Unable to create supplier');
    return json(existing);
  }

  await invalidateCachePattern('suppliers:list:*');
  return json(row, { status: 201 });
}
