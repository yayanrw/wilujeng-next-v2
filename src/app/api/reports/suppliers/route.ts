import { and, desc, eq, gte, lte, sql } from "drizzle-orm";

import { db } from "@/db";
import { stockLogs, suppliers } from "@/db/schema";
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

