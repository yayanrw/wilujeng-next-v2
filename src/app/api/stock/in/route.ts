import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { products, stockLogs, suppliers } from "@/db/schema";
import { badRequest, json, readJson, requireApiSession } from "@/server/api-helpers";

const Schema = z.object({
  productId: z.string().uuid(),
  qty: z.number().int().min(1),
  unitBuyPrice: z.number().int().min(0),
  supplierId: z.string().uuid().optional(),
  supplierName: z.string().min(1).max(80).optional(),
  expiryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  note: z.string().max(200).optional(),
});

async function ensureSupplierId(input: { supplierId?: string; supplierName?: string }) {
  if (input.supplierId) return input.supplierId;
  const name = input.supplierName?.trim();
  if (!name) return null;
  const [created] = await db.insert(suppliers).values({ name }).onConflictDoNothing().returning();
  if (created) return created.id;
  const existing = await db.query.suppliers.findFirst({
    where: (t, { eq: eq2 }) => eq2(t.name, name),
  });
  return existing?.id ?? null;
}

export async function POST(req: Request) {
  const { response } = await requireApiSession(req);
  if (response) return response;

  const { data, error } = await readJson<unknown>(req);
  if (error || !data) return badRequest("Invalid JSON");
  const parsed = Schema.safeParse(data);
  if (!parsed.success) return badRequest(parsed.error.message);

  const supplierId = await ensureSupplierId(parsed.data);

  const result = await db.transaction(async (tx) => {
    const product = await tx.query.products.findFirst({
      where: (t, { eq: eq2 }) => eq2(t.id, parsed.data.productId),
    });
    if (!product) throw new Error("Product not found");

    const prevStock = product.stock;
    const nextStock = prevStock + parsed.data.qty;

    await tx
      .update(products)
      .set({ stock: nextStock, buyPrice: parsed.data.unitBuyPrice, updatedAt: new Date() })
      .where(eq(products.id, parsed.data.productId));

    const [log] = await tx
      .insert(stockLogs)
      .values({
        productId: parsed.data.productId,
        type: "in",
        qty: parsed.data.qty,
        prevStock,
        nextStock,
        note: parsed.data.note,
        expiryDate: parsed.data.expiryDate,
        supplierId,
        unitBuyPrice: parsed.data.unitBuyPrice,
      })
      .returning();

    return { prevStock, nextStock, logId: log?.id ?? null, supplierId };
  });

  return json(result);
}
