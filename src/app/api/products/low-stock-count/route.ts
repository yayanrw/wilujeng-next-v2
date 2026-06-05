import { and, eq, sql } from 'drizzle-orm';

import { db } from '@/db';
import { products } from '@/db/schema';
import { json, requireApiSession } from '@/server/api-helpers';

export async function GET(req: Request) {
  const { response } = await requireApiSession(req);
  if (response) return response;

  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products)
    .where(
      and(
        eq(products.isDeleted, false),
        eq(products.isActive, true),
        sql`${products.stock} <= ${products.minStockThreshold}`,
      ),
    );

  return json({ count: row?.count ?? 0 });
}
