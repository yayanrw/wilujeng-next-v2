import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { suppliers } from '@/db/schema';
import {
  badRequest,
  json,
  notFound,
  requireApiRole,
} from '@/server/api-helpers';
import { invalidateCachePattern } from '@/lib/redis';

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { response } = await requireApiRole(req, 'admin');
  if (response) return response;
  const { id } = await ctx.params;

  const existing = await db.query.suppliers.findFirst({
    where: (t, { eq: eq2 }) => eq2(t.id, id),
  });
  if (!existing) return notFound('Supplier not found');

  // Prevent deleting if any stock_logs reference this supplier
  const used = await db.query.stockLogs.findFirst({
    where: (t, { eq: eq2 }) => eq2(t.supplierId, id),
  });
  if (used) return badRequest('Supplier is in use by stock logs');

  await db.delete(suppliers).where(eq(suppliers.id, id));
  await invalidateCachePattern('suppliers:list:*');
  return json({ deleted: true, id });
}
