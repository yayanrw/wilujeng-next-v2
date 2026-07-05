import { and, eq, gte, lte, sql } from "drizzle-orm";

import { db } from "@/db";
import { products, transactionItems, transactions } from "@/db/schema";
import { badRequest, json, requireApiRole } from "@/server/api-helpers";
import { dayBoundsUtc } from "@/utils/timezone";

function isValidDay(dateStr: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

export async function GET(req: Request) {
  const { response } = await requireApiRole(req, "admin");
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");
  if (!fromStr || !toStr) return badRequest("Missing from/to");
  if (!isValidDay(fromStr) || !isValidDay(toStr)) return badRequest("Invalid from/to");
  const { start: from } = dayBoundsUtc(fromStr);
  const { end: toEnd } = dayBoundsUtc(toStr);
  if (Number.isNaN(from.getTime()) || Number.isNaN(toEnd.getTime())) {
    return badRequest("Invalid from/to");
  }

  const [row] = await db
    .select({
      sales: sql<number>`coalesce(sum(${transactions.totalAmount}), 0)`,
      cogs: sql<number>`coalesce(sum(${transactionItems.qty} * coalesce(${transactionItems.unitBuyPrice}, ${products.buyPrice})), 0)`,
    })
    .from(transactions)
    .leftJoin(transactionItems, eq(transactionItems.transactionId, transactions.id))
    .leftJoin(products, eq(products.id, transactionItems.productId))
    .where(and(gte(transactions.createdAt, from), lte(transactions.createdAt, toEnd), eq(transactions.status, "paid")));

  const sales = row?.sales ?? 0;
  const cogs = row?.cogs ?? 0;
  return json({ sales, cogs, profit: sales - cogs });
}
