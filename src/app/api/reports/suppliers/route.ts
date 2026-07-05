import { and, desc, eq, gte, lte, sql } from "drizzle-orm";

import { db } from "@/db";
import { stockLogs, suppliers } from "@/db/schema";
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

  const rows = await db
    .select({
      supplierId: stockLogs.supplierId,
      supplierName: suppliers.name,
      totalQty: sql<number>`coalesce(sum(${stockLogs.qty}), 0)`,
      purchaseValue: sql<number>`coalesce(sum(${stockLogs.qty} * ${stockLogs.unitBuyPrice}), 0)`,
    })
    .from(stockLogs)
    .leftJoin(suppliers, eq(stockLogs.supplierId, suppliers.id))
    .where(and(eq(stockLogs.type, "in"), gte(stockLogs.createdAt, from), lte(stockLogs.createdAt, toEnd)))
    .groupBy(stockLogs.supplierId, suppliers.name)
    .orderBy(desc(sql`coalesce(sum(${stockLogs.qty} * ${stockLogs.unitBuyPrice}), 0)`))
    .limit(200);

  return json(rows);
}

