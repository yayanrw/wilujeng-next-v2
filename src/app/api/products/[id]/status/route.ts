import { db } from '@/db';
import { products } from '@/db/schema';
import { invalidateCache, invalidateCachePattern } from '@/lib/redis';
import { json, notFound, requireApiRole } from '@/server/api-helpers';
import { eq } from 'drizzle-orm';

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { response } = await requireApiRole(req, 'admin');
  if (response) return response;
  const { id } = await ctx.params;

  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
  });

  if (!product) {
    return notFound('Product not found');
  }

  if (product.isActive) {
    await db
      .update(products)
      .set({ isActive: false })
      .where(eq(products.id, id));
  } else {
    await db
      .update(products)
      .set({ isActive: true })
      .where(eq(products.id, id));
  }

  await invalidateCache('pos:catalog:all');
  await invalidateCache('pos:stocks:all');

  return json({ updated: true, id: product.id });
}
