import { and, eq, sql } from 'drizzle-orm';

import { db } from '@/db';
import { products, productBxgyPromos } from '@/db/schema';
import { json, requireApiSession } from '@/server/api-helpers';

export async function GET(req: Request) {
  const { response } = await requireApiSession(req);
  if (response) return response;

  const notDeleted = eq(products.isDeleted, false);
  const activeAndNotDeleted = and(notDeleted, eq(products.isActive, true));

  const [
    [activeRow],
    [outOfStockRow],
    [lowStockRow],
    [inventoryRow],
    [inactiveRow],
    [bxgyRow],
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(activeAndNotDeleted),

    db.select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(and(activeAndNotDeleted, eq(products.stock, 0))),

    db.select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(and(
        activeAndNotDeleted,
        sql`${products.stock} > 0`,
        sql`${products.stock} <= ${products.minStockThreshold}`,
        sql`${products.minStockThreshold} > 0`,
      )),

    db.select({ total: sql<string>`COALESCE(SUM(${products.stock}::bigint * ${products.averageCost}::bigint), 0)::text` })
      .from(products)
      .where(activeAndNotDeleted),

    db.select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(and(notDeleted, eq(products.isActive, false))),

    db.select({ count: sql<number>`count(distinct ${products.id})::int` })
      .from(products)
      .innerJoin(
        productBxgyPromos,
        and(
          eq(productBxgyPromos.productId, products.id),
          eq(productBxgyPromos.active, true),
        ),
      )
      .where(notDeleted),
  ]);

  return json({
    totalActive: activeRow?.count ?? 0,
    outOfStock: outOfStockRow?.count ?? 0,
    lowStock: lowStockRow?.count ?? 0,
    inventoryValue: Number(inventoryRow?.total ?? 0),
    inactive: inactiveRow?.count ?? 0,
    activeBxgy: bxgyRow?.count ?? 0,
  });
}
