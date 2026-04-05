import { asc, sql } from "drizzle-orm";

import { db } from "@/db";
import { products } from "@/db/schema";
import { json, requireApiRole } from "@/server/api-helpers";

export async function GET(req: Request) {
  const { response } = await requireApiRole(req, "admin");
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const threshold = Number(searchParams.get("threshold") ?? "");
  const hasThreshold = Number.isFinite(threshold);

  const where = hasThreshold
    ? sql`${products.stock} <= ${threshold}`
    : sql`${products.stock} <= ${products.minStockThreshold}`;

  const rows = await db
    .select({
      id: products.id,
      sku: products.sku,
      name: products.name,
      stock: products.stock,
      minStockThreshold: products.minStockThreshold,
    })
    .from(products)
    .where(where)
    .orderBy(asc(products.name))
    .limit(500);

  return json(rows);
}

