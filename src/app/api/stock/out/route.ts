import { eq, sql, and } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { products, stockLogs, transactions, transactionItems, pointsLog, customers } from '@/db/schema';
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
  type: z.enum(['out', 'return']).default('out'),
  transactionId: z.string().uuid().optional(),
  returnReason: z.string().optional(),
});

export async function POST(req: Request) {
  const { response } = await requireApiSession(req);
  if (response) return response;

  const { data, error } = await readJson<unknown>(req);
  if (error || !data) return badRequest('Invalid JSON');
  const parsed = Schema.safeParse(data);
  if (!parsed.success) return badRequest(parsed.error.message);

  try {
    const result = await db.transaction(async (tx) => {
      const product = await tx.query.products.findFirst({
        where: (t, { eq: eq2 }) => eq2(t.id, parsed.data.productId),
      });
      if (!product) throw new Error('Product not found');
      
      const prevStock = product.stock;
      let nextStock = prevStock;

      if (parsed.data.type === 'out') {
        if (prevStock < parsed.data.qty) throw new Error('stock_insufficient');
        nextStock = prevStock - parsed.data.qty;
      } else if (parsed.data.type === 'return') {
        nextStock = prevStock + parsed.data.qty;

        // Points deduction logic for return
        if (parsed.data.transactionId) {
          const txInfo = await tx.query.transactions.findFirst({
            where: eq(transactions.id, parsed.data.transactionId),
          });
          
          if (txInfo && txInfo.customerId) {
            const txItem = await tx.query.transactionItems.findFirst({
              where: and(
                eq(transactionItems.transactionId, txInfo.id), 
                eq(transactionItems.productId, product.id)
              ),
            });

            if (txItem) {
              const returnedValue = parsed.data.qty * txItem.priceAtTransaction;
              const pointsDeduct = Math.floor(returnedValue / 1000);

              if (pointsDeduct > 0) {
                await tx.insert(pointsLog).values({
                  customerId: txInfo.customerId,
                  transactionId: txInfo.id,
                  delta: -pointsDeduct,
                  reason: 'return',
                });

                await tx
                  .update(customers)
                  .set({
                    points: sql`${customers.points} - ${pointsDeduct}`,
                    updatedAt: new Date(),
                  })
                  .where(eq(customers.id, txInfo.customerId));
              }
            }
          }
        }
      }

      await tx
        .update(products)
        .set({ stock: nextStock, updatedAt: new Date() })
        .where(eq(products.id, parsed.data.productId));

      const [log] = await tx
        .insert(stockLogs)
        .values({
          productId: parsed.data.productId,
          type: parsed.data.type,
          qty: parsed.data.qty,
          prevStock,
          nextStock,
          note: parsed.data.note,
          transactionId: parsed.data.transactionId,
          returnReason: parsed.data.returnReason,
        })
        .returning();

      return { prevStock, nextStock, logId: log?.id ?? null };
    });

    await invalidateCachePattern('products:catalog:*');

    return json(result);
  } catch (err: any) {
    if (err.message === 'stock_insufficient') {
      return json({ error: 'stock_insufficient', message: 'Insufficient stock' }, { status: 409 });
    }
    return json({ error: err.message }, { status: 500 });
  }
}

