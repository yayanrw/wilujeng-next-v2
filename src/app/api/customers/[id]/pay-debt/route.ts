import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { customers, transactions } from '@/db/schema';
import { badRequest, json, notFound, readJson, requireApiSession } from '@/server/api-helpers';

const PayDebtSchema = z.object({
  amount: z.number().int().min(1),
  paymentMethod: z.enum(['cash', 'transfer', 'qris', 'card']),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireApiSession(req);
  if (response) return response;
  const { id } = await ctx.params;

  const { data, error } = await readJson<unknown>(req);
  if (error || !data) return badRequest('Invalid JSON');
  const parsed = PayDebtSchema.safeParse(data);
  if (!parsed.success) return badRequest(parsed.error.message);

  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, id),
  });

  if (!customer) return notFound('Customer not found');
  if (customer.totalDebt <= 0) return badRequest('Customer has no debt');
  if (parsed.data.amount > customer.totalDebt) {
    return badRequest(`Payment amount cannot exceed total debt (${customer.totalDebt})`);
  }

  // Record a payment transaction that reduces debt
  await db.transaction(async (tx) => {
    // We create a special transaction record for debt payment
    // totalAmount = 0 because it's not a new sale, it's just a payment
    // amountReceived = the amount paid towards debt
    await tx.insert(transactions).values({
      customerId: customer.id,
      userId: session.user.id,
      totalAmount: 0, 
      paymentMethod: parsed.data.amount === customer.totalDebt ? parsed.data.paymentMethod : `partial_${parsed.data.paymentMethod}`,
      amountReceived: parsed.data.amount,
      change: 0,
      status: 'paid_debt', // Special status to denote debt payment
      createdAt: new Date(),
    });

    await tx
      .update(customers)
      .set({
        totalDebt: sql`${customers.totalDebt} - ${parsed.data.amount}`,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, customer.id));
  });

  return json({ success: true });
}
