import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';

import { db } from '@/db';
import {
  customers,
  products,
  stockLogs,
  suppliers,
  transactions,
  transactionItems,
} from '@/db/schema';
import { json, requireApiSession } from '@/server/api-helpers';

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function GET(req: Request) {
  const { response } = await requireApiSession(req);
  if (response) return response;

  const url = new URL(req.url);
  const filter = url.searchParams.get('filter') || 'daily'; // daily, weekly, monthly

  const now = new Date();
  const start = startOfDay(now);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  // Determine chart date range based on filter
  const chartEnd = new Date(end);
  const chartStart = new Date(start);
  let groupByFormat = 'YYYY-MM-DD';

  if (filter === 'daily') {
    chartStart.setDate(chartStart.getDate() - 7); // Last 7 days
    groupByFormat = 'YYYY-MM-DD';
  } else if (filter === 'weekly') {
    chartStart.setDate(chartStart.getDate() - 28); // Last 4 weeks
    groupByFormat = 'IYYY-IW'; // ISO year and week number
  } else if (filter === 'monthly') {
    chartStart.setMonth(chartStart.getMonth() - 6); // Last 6 months
    groupByFormat = 'YYYY-MM';
  }

  // Fetch PNL chart data
  const pnlChartDataRaw = await db
    .select({
      date: sql<string>`to_char(${transactions.createdAt}, ${sql.raw(`'${groupByFormat}'`)})`,
      sales: sql<number>`coalesce(sum(${transactionItems.subtotal}), 0)`,
      cogs: sql<number>`coalesce(sum(${transactionItems.qty} * ${products.buyPrice}), 0)`,
    })
    .from(transactions)
    .innerJoin(
      transactionItems,
      eq(transactions.id, transactionItems.transactionId),
    )
    .innerJoin(products, eq(transactionItems.productId, products.id))
    .where(
      and(
        eq(transactions.status, 'paid'),
        gte(transactions.createdAt, chartStart),
        lte(transactions.createdAt, chartEnd),
      ),
    )
    .groupBy(
      sql`to_char(${transactions.createdAt}, ${sql.raw(`'${groupByFormat}'`)})`,
    )
    .orderBy(
      sql`to_char(${transactions.createdAt}, ${sql.raw(`'${groupByFormat}'`)})`,
    );

  const pnlChartData = pnlChartDataRaw.map((row) => ({
    date: row.date,
    sales: Number(row.sales),
    grossProfit: Number(row.sales) - Number(row.cogs),
  }));

  const [todaySalesRow] = await db
    .select({
      total: sql<number>`coalesce(sum(${transactionItems.subtotal}), 0)`,
      count: sql<number>`count(DISTINCT ${transactions.id})`,
      cogs: sql<number>`coalesce(sum(${transactionItems.qty} * ${products.buyPrice}), 0)`,
    })
    .from(transactions)
    .leftJoin(
      transactionItems,
      eq(transactions.id, transactionItems.transactionId),
    )
    .leftJoin(products, eq(transactionItems.productId, products.id))
    .where(
      and(
        eq(transactions.status, 'paid'),
        gte(transactions.createdAt, start),
        lte(transactions.createdAt, end),
      ),
    );

  const [lowStockRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(sql`${products.stock} <= ${products.minStockThreshold}`);

  const [receivablesRow] = await db
    .select({ total: sql<number>`coalesce(sum(${customers.totalDebt}), 0)` })
    .from(customers);

  const topReceivables = await db
    .select({
      id: customers.id,
      name: customers.name,
      totalDebt: customers.totalDebt,
    })
    .from(customers)
    .where(sql`${customers.totalDebt} > 0`)
    .orderBy(desc(customers.totalDebt))
    .limit(5);

  const lowStockItems = await db
    .select({
      id: products.id,
      name: products.name,
      sku: products.sku,
      stock: products.stock,
      minStockThreshold: products.minStockThreshold,
    })
    .from(products)
    .where(sql`${products.stock} <= ${products.minStockThreshold}`)
    .orderBy(products.stock)
    .limit(5);

  const topSalesProducts = await db
    .select({
      productId: transactionItems.productId,
      productName: products.name,
      productSku: products.sku,
      totalQty: sql<number>`coalesce(sum(${transactionItems.qty}), 0)`,
      totalSales: sql<number>`coalesce(sum(${transactionItems.subtotal}), 0)`,
    })
    .from(transactionItems)
    .innerJoin(products, eq(transactionItems.productId, products.id))
    .innerJoin(
      transactions,
      eq(transactionItems.transactionId, transactions.id),
    )
    .where(eq(transactions.status, 'paid'))
    .groupBy(transactionItems.productId, products.name, products.sku)
    .orderBy(desc(sql`coalesce(sum(${transactionItems.qty}), 0)`))
    .limit(5);

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
    .where(and(eq(stockLogs.type, 'in'), gte(stockLogs.createdAt, from30)))
    .groupBy(stockLogs.supplierId, suppliers.name)
    .orderBy(
      desc(sql`coalesce(sum(${stockLogs.qty} * ${stockLogs.unitBuyPrice}), 0)`),
    )
    .limit(10);

  return json({
    todaySales: todaySalesRow?.total ?? 0,
    todayTransactionCount: todaySalesRow?.count ?? 0,
    todayGrossProfit: (todaySalesRow?.total ?? 0) - (todaySalesRow?.cogs ?? 0),
    lowStockCount: lowStockRow?.count ?? 0,
    receivablesTotal: receivablesRow?.total ?? 0,
    topSuppliers,
    topReceivables,
    lowStockItems,
    topSalesProducts,
    pnlChartData,
  });
}
