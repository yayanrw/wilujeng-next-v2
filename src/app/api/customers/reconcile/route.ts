import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { customers } from '@/db/schema';
import { json, requireApiSession } from '@/server/api-helpers';

export async function POST(req: Request) {
  const { session, response } = await requireApiSession(req);
  if (response) return response;

  if (session.user.role !== 'admin') {
    return json({ error: 'unauthorized' }, { status: 403 });
  }

  // Calculate the correct debt and correct points
  await db.transaction(async (tx) => {
    // We can do a mass update using a single complex SQL query or fetch and update individually.
    // For simplicity, we will calculate real debt from transactions with status 'hutang'
    // and debt_payments for each customer.
    await tx.execute(sql`
      UPDATE customers c
      SET 
        total_debt = COALESCE(
          (SELECT SUM(total_amount - amount_received) FROM transactions WHERE customer_id = c.id AND status = 'hutang'), 0
        ) - COALESCE(
          (SELECT SUM(amount) FROM debt_payments WHERE customer_id = c.id), 0
        ),
        points = COALESCE(
          (SELECT SUM(delta) FROM points_log WHERE customer_id = c.id), 0
        )
    `);
    
    // Safety check - debt should not be less than 0
    await tx.execute(sql`
      UPDATE customers SET total_debt = 0 WHERE total_debt < 0
    `);
  });

  return json({ success: true });
}
