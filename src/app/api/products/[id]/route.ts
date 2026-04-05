import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { brands, categories, productTiers, products } from "@/db/schema";
import { badRequest, json, notFound, readJson, requireApiRole } from "@/server/api-helpers";

const TierSchema = z.object({
  minQty: z.number().int().min(1),
  price: z.number().int().min(1),
});

const UpdateSchema = z.object({
  sku: z.string().min(1).max(80).optional(),
  name: z.string().min(1).max(120).optional(),
  categoryId: z.string().uuid().optional().nullable(),
  categoryName: z.string().min(1).max(80).optional(),
  brandId: z.string().uuid().optional().nullable(),
  brandName: z.string().min(1).max(80).optional(),
  basePrice: z.number().int().min(0).optional(),
  buyPrice: z.number().int().min(0).optional(),
  stock: z.number().int().min(0).optional(),
  minStockThreshold: z.number().int().min(0).optional(),
  tiers: z.array(TierSchema).optional(),
});

async function ensureCategoryId(input: { categoryId?: string | null; categoryName?: string }) {
  if (input.categoryId) return input.categoryId;
  const name = input.categoryName?.trim();
  if (!name) return input.categoryId ?? null;
  const [created] = await db.insert(categories).values({ name }).onConflictDoNothing().returning();
  if (created) return created.id;
  const existing = await db.query.categories.findFirst({
    where: (t, { eq: eq2 }) => eq2(t.name, name),
  });
  return existing?.id ?? null;
}

async function ensureBrandId(input: { brandId?: string | null; brandName?: string }) {
  if (input.brandId) return input.brandId;
  const name = input.brandName?.trim();
  if (!name) return input.brandId ?? null;
  const [created] = await db.insert(brands).values({ name }).onConflictDoNothing().returning();
  if (created) return created.id;
  const existing = await db.query.brands.findFirst({
    where: (t, { eq: eq2 }) => eq2(t.name, name),
  });
  return existing?.id ?? null;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { response } = await requireApiRole(req, "admin");
  if (response) return response;
  const { id } = await ctx.params;

  const { data, error } = await readJson<unknown>(req);
  if (error || !data) return badRequest("Invalid JSON");
  const parsed = UpdateSchema.safeParse(data);
  if (!parsed.success) return badRequest(parsed.error.message);

  const existing = await db.query.products.findFirst({
    where: (t, { eq: eq2 }) => eq2(t.id, id),
  });
  if (!existing) return notFound("Product not found");

  const categoryId =
    parsed.data.categoryId !== undefined || parsed.data.categoryName !== undefined
      ? await ensureCategoryId(parsed.data)
      : undefined;
  const brandId =
    parsed.data.brandId !== undefined || parsed.data.brandName !== undefined
      ? await ensureBrandId(parsed.data)
      : undefined;

  await db.transaction(async (tx) => {
    await tx
      .update(products)
      .set({
        ...("sku" in parsed.data ? { sku: parsed.data.sku } : {}),
        ...("name" in parsed.data ? { name: parsed.data.name } : {}),
        ...("basePrice" in parsed.data ? { basePrice: parsed.data.basePrice } : {}),
        ...("buyPrice" in parsed.data ? { buyPrice: parsed.data.buyPrice } : {}),
        ...("stock" in parsed.data ? { stock: parsed.data.stock } : {}),
        ...("minStockThreshold" in parsed.data
          ? { minStockThreshold: parsed.data.minStockThreshold }
          : {}),
        ...(categoryId !== undefined ? { categoryId } : {}),
        ...(brandId !== undefined ? { brandId } : {}),
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));

    if (parsed.data.tiers) {
      await tx.delete(productTiers).where(eq(productTiers.productId, id));
      if (parsed.data.tiers.length) {
        await tx.insert(productTiers).values(
          parsed.data.tiers.map((t) => ({
            productId: id,
            minQty: t.minQty,
            price: t.price,
          })),
        );
      }
    }
  });

  return json({ updated: true });
}
