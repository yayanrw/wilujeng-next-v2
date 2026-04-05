import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { transactionItems, transactions, products } from '@/db/schema';
import { json, notFound, requireApiRole } from '@/server/api-helpers';

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { response } = await requireApiRole(req, 'admin');
  if (response) return response;

  const { id } = await ctx.params;

  const tx = await db.query.transactions.findFirst({
    where: (t, { eq: eq2 }) => eq2(t.id, id),
  });

  if (!tx) return notFound('Transaction not found');

  const items = await db
    .select({
      id: transactionItems.id,
      productId: transactionItems.productId,
      qty: transactionItems.qty,
      priceAtTransaction: transactionItems.priceAtTransaction,
      subtotal: transactionItems.subtotal,
      productName: products.name,
      productSku: products.sku,
    })
    .from(transactionItems)
    .leftJoin(products, eq(transactionItems.productId, products.id))
    .where(eq(transactionItems.transactionId, id));

  return json({ ...tx, items });
}
