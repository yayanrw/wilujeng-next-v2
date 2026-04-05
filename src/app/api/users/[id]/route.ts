import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { users } from '@/db/schema';
import {
  badRequest,
  json,
  notFound,
  readJson,
  requireApiRole,
} from '@/server/api-helpers';

const Schema = z.object({
  name: z.string().min(1).max(80).optional(),
  role: z.enum(['admin', 'cashier']).optional(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { response } = await requireApiRole(req, 'admin');
  if (response) return response;

  const { id } = await ctx.params;
  const { data, error } = await readJson<unknown>(req);
  if (error || !data) return badRequest('Invalid JSON');
  const parsed = Schema.safeParse(data);
  if (!parsed.success) return badRequest(parsed.error.message);

  const updates: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.role !== undefined) updates.role = parsed.data.role;

  const [row] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, id))
    .returning();

  if (!row) return notFound('User not found');
  return json({ updated: true });
}
