import { and, desc, eq, gte, lte, sql } from "drizzle-orm";

import { db } from "@/db";
import { customers, products, stockLogs, suppliers, transactions } from "@/db/schema";
import { json, requireApiSession } from "@/server/api-helpers";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function GET(req: Request) {
  const { response } = await requireApiSession(req);
  if (response) return response;

  const now = new Date();
  const start = startOfDay(now);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const [todaySalesRow] = await db
    .select({ total: sql<number>`coalesce(sum(${transactions.totalAmount}), 0)` })
    .from(transactions)
    .where(and(eq(transactions.status, "paid"), gte(transactions.createdAt, start), lte(transactions.createdAt, end)));

  const [lowStockRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(sql`${products.stock} <= ${products.minStockThreshold}`);

  const [receivablesRow] = await db
    .select({ total: sql<number>`coalesce(sum(${customers.totalDebt}), 0)` })
    .from(customers);

  const from30 = new Date(now);
  from30.setDate(from30.getDate() - 30);

  const topSuppliers = await db
    .select({
      supplierId: stockLogs.supplierId,
      supplierName: suppliers.name,
      purchaseValue: sql<number>`coalesce(sum(${stockLogs.qty} * ${stockLogs.unitBuyPrice}), 0)`,
      totalQty: sql<number>`coalesce(sum(${stockLogs.qty}), 0)`,
    })
    .from(stockLogs)
    .leftJoin(suppliers, eq(stockLogs.supplierId, suppliers.id))
    .where(and(eq(stockLogs.type, "in"), gte(stockLogs.createdAt, from30)))
    .groupBy(stockLogs.supplierId, suppliers.name)
    .orderBy(desc(sql`coalesce(sum(${stockLogs.qty} * ${stockLogs.unitBuyPrice}), 0)`))
    .limit(10);

  return json({
    todaySales: todaySalesRow?.total ?? 0,
    lowStockCount: lowStockRow?.count ?? 0,
    receivablesTotal: receivablesRow?.total ?? 0,
    topSuppliers,
  });
}

