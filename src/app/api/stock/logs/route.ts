import { and, desc, eq, gte, lte } from 'drizzle-orm';

import { db } from '@/db';
import { products, stockLogs } from '@/db/schema';
import { json, requireApiSession } from '@/server/api-helpers';

export async function GET(req: Request) {
  const { response } = await requireApiSession(req);
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId');
  const type = searchParams.get('type');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  const fromDate = from ? new Date(`${from}T00:00:00`) : undefined;
  const toDate = to ? new Date(`${to}T23:59:59`) : undefined;

  const where = and(
    productId ? eq(stockLogs.productId, productId) : undefined,
    type ? eq(stockLogs.type, type) : undefined,
    fromDate ? gte(stockLogs.createdAt, fromDate) : undefined,
    toDate ? lte(stockLogs.createdAt, toDate) : undefined,
  );

  const rows = await db
    .select({
      id: stockLogs.id,
      productId: stockLogs.productId,
      productName: products.name,
      productSku: products.sku,
      type: stockLogs.type,
      qty: stockLogs.qty,
      prevStock: stockLogs.prevStock,
      nextStock: stockLogs.nextStock,
      note: stockLogs.note,
      expiryDate: stockLogs.expiryDate,
      supplierId: stockLogs.supplierId,
      unitBuyPrice: stockLogs.unitBuyPrice,
      createdAt: stockLogs.createdAt,
    })
    .from(stockLogs)
    .leftJoin(products, eq(stockLogs.productId, products.id))
    .where(where)
    .orderBy(desc(stockLogs.createdAt))
    .limit(limit)
    .offset(offset);

  return json(rows);
}
