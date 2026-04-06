import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { products, stockLogs } from '@/db/schema';
import {
  badRequest,
  json,
  readJson,
  requireApiSession,
} from '@/server/api-helpers';
import { invalidateCachePattern } from '@/lib/redis';

const Schema = z.object({
  productId: z.string().uuid(),
  qty: z.number().int().min(1),
  note: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  const { response } = await requireApiSession(req);
  if (response) return response;

  const { data, error } = await readJson<unknown>(req);
  if (error || !data) return badRequest('Invalid JSON');
  const parsed = Schema.safeParse(data);
  if (!parsed.success) return badRequest(parsed.error.message);

  const result = await db.transaction(async (tx) => {
    const product = await tx.query.products.findFirst({
      where: (t, { eq: eq2 }) => eq2(t.id, parsed.data.productId),
    });
    if (!product) throw new Error('Product not found');
    if (product.stock < parsed.data.qty) throw new Error('Insufficient stock');

    const prevStock = product.stock;
    const nextStock = prevStock - parsed.data.qty;

    await tx
      .update(products)
      .set({ stock: nextStock, updatedAt: new Date() })
      .where(eq(products.id, parsed.data.productId));

    const [log] = await tx
      .insert(stockLogs)
      .values({
        productId: parsed.data.productId,
        type: 'out',
        qty: parsed.data.qty,
        prevStock,
        nextStock,
        note: parsed.data.note,
      })
      .returning();

    return { prevStock, nextStock, logId: log?.id ?? null };
  });

  await invalidateCachePattern('products:catalog:*');

  return json(result);
}
