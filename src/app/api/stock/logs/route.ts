import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { stockLogs } from "@/db/schema";
import { json, requireApiSession } from "@/server/api-helpers";

export async function GET(req: Request) {
  const { response } = await requireApiSession(req);
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  const type = searchParams.get("type");

  const where = and(
    productId ? eq(stockLogs.productId, productId) : undefined,
    type ? eq(stockLogs.type, type) : undefined,
  );

  const rows = await db
    .select({
      id: stockLogs.id,
      productId: stockLogs.productId,
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
    .where(where)
    .orderBy(desc(stockLogs.createdAt))
    .limit(200);

  return json(rows);
}

