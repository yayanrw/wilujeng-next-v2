import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { brands, products } from '@/db/schema';
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

  const existing = await db.query.brands.findFirst({
    where: (t, { eq: eq2 }) => eq2(t.id, id),
  });
  if (!existing) return notFound('Brand not found');

  // Prevent deleting if any product references this brand
  const used = await db.query.products.findFirst({
    where: (t, { eq: eq2 }) => eq2(t.brandId, id),
  });
  if (used) return badRequest('Brand is in use by products');

  await db.delete(brands).where(eq(brands.id, id));
  await invalidateCachePattern('brands:list:*');

  return json({ deleted: true, id });
}
