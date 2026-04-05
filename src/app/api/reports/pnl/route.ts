import { and, eq, gte, lte, sql } from "drizzle-orm";

import { db } from "@/db";
import { products, transactionItems, transactions } from "@/db/schema";
import { badRequest, json, requireApiRole } from "@/server/api-helpers";

function parseDate(dateStr: string) {
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
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");
  if (!fromStr || !toStr) return badRequest("Missing from/to");
  const from = parseDate(fromStr);
  const to = parseDate(toStr);
  if (!from || !to) return badRequest("Invalid from/to");
  const toEnd = new Date(to);
  toEnd.setDate(toEnd.getDate() + 1);

  const [row] = await db
    .select({
      sales: sql<number>`coalesce(sum(${transactions.totalAmount}), 0)`,
      cogs: sql<number>`coalesce(sum(${transactionItems.qty} * ${products.buyPrice}), 0)`,
    })
    .from(transactions)
    .leftJoin(transactionItems, eq(transactionItems.transactionId, transactions.id))
    .leftJoin(products, eq(products.id, transactionItems.productId))
    .where(and(gte(transactions.createdAt, from), lte(transactions.createdAt, toEnd), eq(transactions.status, "paid")));

  const sales = row?.sales ?? 0;
  const cogs = row?.cogs ?? 0;
  return json({ sales, cogs, profit: sales - cogs });
}
