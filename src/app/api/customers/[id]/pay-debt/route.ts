import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { customers, debtPayments, pointsLog } from '@/db/schema';
import { badRequest, json, notFound, readJson, requireApiSession } from '@/server/api-helpers';

const PayDebtSchema = z.object({
  amount: z.number().int().min(1),
  paymentMethod: z.enum(['cash', 'transfer', 'qris', 'card']),
  note: z.string().optional(),
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

  await db.transaction(async (tx) => {
    await tx.insert(debtPayments).values({
      customerId: customer.id,
      amount: parsed.data.amount,
      method: parsed.data.paymentMethod,
      userId: session.user.id,
      note: parsed.data.note,
      paidAt: new Date(),
    });

    const pointsAdd = Math.floor(parsed.data.amount / 1000);
    if (pointsAdd > 0) {
      await tx.insert(pointsLog).values({
        customerId: customer.id,
        delta: pointsAdd,
        reason: 'debt_paid',
      });
    }

    await tx
      .update(customers)
      .set({
        points: sql`${customers.points} + ${pointsAdd}`,
        totalDebt: sql`${customers.totalDebt} - ${parsed.data.amount}`,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, customer.id));
  });

  return json({ success: true });
}

