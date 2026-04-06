import { asc, ilike } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { categories } from '@/db/schema';
import {
  badRequest,
  json,
  readJson,
  requireApiRole,
  requireApiSession,
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

  const cacheKey = `categories:list:${search || 'all'}`;
  const cachedData = await getCachedData(cacheKey);

  if (cachedData) {
    return json(cachedData);
  }

  const rows = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(search ? ilike(categories.name, `%${search}%`) : undefined)
    .orderBy(asc(categories.name))
    .limit(50);

  await setCachedData(cacheKey, rows);
  return json(rows);
}

const CreateSchema = z.object({ name: z.string().min(1).max(80) });

export async function POST(req: Request) {
  const { response } = await requireApiRole(req, 'admin');
  if (response) return response;

  const { data, error } = await readJson<unknown>(req);
  if (error || !data) return badRequest('Invalid JSON');
  const parsed = CreateSchema.safeParse(data);
  if (!parsed.success) return badRequest(parsed.error.message);

  const [row] = await db
    .insert(categories)
    .values({ name: parsed.data.name })
    .onConflictDoNothing()
    .returning();

  if (!row) {
    const existing = await db.query.categories.findFirst({
      where: (t, { eq }) => eq(t.name, parsed.data.name),
    });
    if (!existing) return badRequest('Unable to create category');
    return json({ id: existing.id, name: existing.name });
  }

  await invalidateCachePattern('categories:list:*');
  return json({ id: row.id, name: row.name }, { status: 201 });
}
