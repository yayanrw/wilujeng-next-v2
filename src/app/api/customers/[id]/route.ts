import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { customers, transactions } from "@/db/schema";
import { badRequest, json, notFound, readJson, requireApiSession } from "@/server/api-helpers";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { response } = await requireApiSession(req);
  if (response) return response;
  const { id } = await ctx.params;

  const customer = await db.query.customers.findFirst({
    where: (t, { eq: eq2 }) => eq2(t.id, id),
  });
  if (!customer) return notFound("Customer not found");

  const txs = await db
    .select({
      id: transactions.id,
      totalAmount: transactions.totalAmount,
      paymentMethod: transactions.paymentMethod,
      status: transactions.status,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .where(eq(transactions.customerId, id))
    .orderBy(desc(transactions.createdAt))
    .limit(50);

  return json({ customer, transactions: txs });
}

const UpdateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  phone: z.string().max(80).optional(),
  address: z.string().max(200).optional(),
  points: z.number().int().min(0).optional(),
  totalDebt: z.number().int().min(0).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { response } = await requireApiSession(req);
  if (response) return response;
  const { id } = await ctx.params;

  const { data, error } = await readJson<unknown>(req);
  if (error || !data) return badRequest("Invalid JSON");
  const parsed = UpdateSchema.safeParse(data);
  if (!parsed.success) return badRequest(parsed.error.message);

  const [row] = await db
    .update(customers)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(customers.id, id))
    .returning();

  if (!row) return notFound("Customer not found");
  return json(row);
}

