import { eq, gte, gt, sql } from 'drizzle-orm';

import { db } from '@/db';
import { users, sessions } from '@/db/schema';
import { json, requireApiRole } from '@/server/api-helpers';

export async function GET(req: Request) {
  const { response } = await requireApiRole(req, 'admin');
  if (response) return response;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    [totalRow],
    [adminsRow],
    [cashiersRow],
    [newRow],
    [activeRow],
  ] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(users),

    db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.role, 'admin')),

    db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.role, 'cashier')),

    db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(gte(users.createdAt, startOfMonth)),

    db
      .select({ count: sql<number>`count(distinct ${sessions.userId})::int` })
      .from(sessions)
      .where(gt(sessions.expiresAt, now)),
  ]);

  return json({
    total: totalRow?.count ?? 0,
    admins: adminsRow?.count ?? 0,
    cashiers: cashiersRow?.count ?? 0,
    newThisMonth: newRow?.count ?? 0,
    activeSessions: activeRow?.count ?? 0,
  });
}
