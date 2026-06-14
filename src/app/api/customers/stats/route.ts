import { and, eq, gt, gte, sql } from 'drizzle-orm';

import { db } from '@/db';
import { customers } from '@/db/schema';
import { json, requireApiSession } from '@/server/api-helpers';

export async function GET(req: Request) {
  const { response } = await requireApiSession(req);
  if (response) return response;

  const notDeleted = eq(customers.isDeleted, false);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    [totalRow],
    [debtorRow],
    [debtRow],
    [pointsRow],
    [newRow],
  ] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(customers)
      .where(notDeleted),

    db
      .select({ count: sql<number>`count(*)::int` })
      .from(customers)
      .where(and(notDeleted, gt(customers.totalDebt, 0))),

    db
      .select({
        total: sql<string>`COALESCE(SUM(${customers.totalDebt}::bigint), 0)::text`,
      })
      .from(customers)
      .where(notDeleted),

    db
      .select({
        total: sql<string>`COALESCE(SUM(${customers.points}::bigint), 0)::text`,
      })
      .from(customers)
      .where(notDeleted),

    db
      .select({ count: sql<number>`count(*)::int` })
      .from(customers)
      .where(and(notDeleted, gte(customers.createdAt, startOfMonth))),
  ]);

  return json({
    total: totalRow?.count ?? 0,
    debtorCount: debtorRow?.count ?? 0,
    totalDebt: Number(debtRow?.total ?? 0),
    totalPoints: Number(pointsRow?.total ?? 0),
    newThisMonth: newRow?.count ?? 0,
  });
}
