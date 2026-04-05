import { and, desc, eq, gte, lte } from "drizzle-orm";

import { db } from "@/db";
import { customers, transactions } from "@/db/schema";
import { badRequest, json, requireApiRole } from "@/server/api-helpers";

function parseDay(dateStr: string) {
  const m = /^\d{4}-\d{2}-\d{2}$/.exec(dateStr);
  if (!m) return null;
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export async function GET(req: Request) {
  const { response } = await requireApiRole(req, "admin");
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date");
  const methodStr = searchParams.get("method");
  if (!dateStr) return badRequest("Missing date");
  const start = parseDay(dateStr);
  if (!start) return badRequest("Invalid date");
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

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
