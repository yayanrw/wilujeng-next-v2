import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { categories, products } from '@/db/schema';
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

  const existing = await db.query.categories.findFirst({
    where: eq(categories.id, id),
  });
  if (!existing) return notFound('Category not found');

  // Prevent deleting if any product references this category
  const used = await db.query.products.findFirst({
    where: (t, { eq: eq2 }) => eq2(t.categoryId, id),
  });
  if (used) return badRequest('Category is in use by products');

  await db.delete(categories).where(eq(categories.id, id));

  await invalidateCachePattern('categories:list:*');
  return json({ deleted: true, id });
}
