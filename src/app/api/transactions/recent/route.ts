import { desc, eq, gte } from 'drizzle-orm';

import { db } from '@/db';
import { customers, transactions } from '@/db/schema';
import { json, requireApiSession } from '@/server/api-helpers';

// Recent transactions for the Stock-Out return picker. Staff-accessible
// (requireApiSession, not admin) so cashiers can process returns. Last 30
// days, client filters the small result set locally.
export async function GET(req: Request) {
  const { response } = await requireApiSession(req);
  if (response) return response;

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      id: transactions.id,
      customerName: customers.name,
      totalAmount: transactions.totalAmount,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .leftJoin(customers, eq(transactions.customerId, customers.id))
    .where(gte(transactions.createdAt, since))
    .orderBy(desc(transactions.createdAt))
    .limit(100);

  return json(rows);
}
