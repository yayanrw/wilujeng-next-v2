import "server-only";

import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { products, stockLogs, suppliers } from '@/db/schema';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function ensureSupplierId(input: {
  supplierId?: string;
  supplierName?: string;
}) {
  if (input.supplierId) return input.supplierId;
  const name = input.supplierName?.trim();
  if (!name) return null;
  const [created] = await db
    .insert(suppliers)
    .values({ name })
    .onConflictDoNothing()
    .returning();
  if (created) return created.id;
  const existing = await db.query.suppliers.findFirst({
    where: (t, { eq: eq2 }) => eq2(t.name, name),
  });
  return existing?.id ?? null;
}

export async function applyStockIn(
  tx: Tx,
  input: {
    productId: string;
    qty: number;
    unitBuyPrice: number;
    expiryDate?: string;
    note?: string;
    supplierId: string | null;
  },
) {
  const product = await tx.query.products.findFirst({
    where: (t, { eq: eq2 }) => eq2(t.id, input.productId),
  });
  if (!product) throw new Error('Product not found');

  const prevStock = product.stock;
  const nextStock = prevStock + input.qty;

  const prevAverage = product.averageCost;
  const nextAverage =
    prevStock <= 0
      ? input.unitBuyPrice
      : Math.round(
          (prevStock * prevAverage + input.qty * input.unitBuyPrice) /
            nextStock,
        );

  await tx
    .update(products)
    .set({
      stock: nextStock,
      buyPrice: input.unitBuyPrice,
      averageCost: nextAverage,
      updatedAt: new Date(),
    })
    .where(eq(products.id, input.productId));

  const [log] = await tx
    .insert(stockLogs)
    .values({
      productId: input.productId,
      type: 'in',
      qty: input.qty,
      prevStock,
      nextStock,
      note: input.note,
      expiryDate: input.expiryDate,
      supplierId: input.supplierId,
      unitBuyPrice: input.unitBuyPrice,
    })
    .returning();

  return {
    productId: input.productId,
    prevStock,
    nextStock,
    averageCost: nextAverage,
    logId: log?.id ?? null,
  };
}
