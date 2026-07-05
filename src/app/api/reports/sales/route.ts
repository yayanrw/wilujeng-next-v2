import { and, desc, eq, gte, lte } from "drizzle-orm";

import { db } from "@/db";
import { customers, transactions } from "@/db/schema";
import { badRequest, json, requireApiRole } from "@/server/api-helpers";
import { dayBoundsUtc } from "@/utils/timezone";

function isValidDay(dateStr: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

export async function GET(req: Request) {
  const { response } = await requireApiRole(req, "admin");
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date");
  const methodStr = searchParams.get("method");
  if (!dateStr) return badRequest("Missing date");
  if (!isValidDay(dateStr)) return badRequest("Invalid date");
  const { start, end } = dayBoundsUtc(dateStr);
  if (Number.isNaN(start.getTime())) return badRequest("Invalid date");

  const filters = [
    gte(transactions.createdAt, start),
    lte(transactions.createdAt, end),
  ];

  if (methodStr && methodStr !== 'all') {
    filters.push(eq(transactions.paymentMethod, methodStr));
  }

  const rows = await db
    .select({
      id: transactions.id,
      customerId: transactions.customerId,
      customerName: customers.name,
      userId: transactions.userId,
      totalAmount: transactions.totalAmount,
      paymentMethod: transactions.paymentMethod,
      status: transactions.status,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .leftJoin(customers, eq(transactions.customerId, customers.id))
    .where(and(...filters))
    .orderBy(desc(transactions.createdAt))
    .limit(500);

  return json(rows);
}
