import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { settings } from "@/db/schema";
import { badRequest, json, readJson, requireApiRole } from "@/server/api-helpers";
import { getCachedData, setCachedData, invalidateCache } from "@/lib/redis";

const CACHE_KEY = "store:settings";

export async function GET() {
  const cachedSettings = await getCachedData(CACHE_KEY);
  if (cachedSettings) {
    return json(cachedSettings);
  }

  const row = await db.query.settings.findFirst({
    orderBy: (t) => [desc(t.updatedAt)],
  });

  const responseData = {
    storeName: row?.storeName ?? "SimplePOS Pro",
    storeIconName: row?.storeIconName ?? "Store",
    storeAddress: row?.storeAddress ?? "",
    storePhone: row?.storePhone ?? "",
    receiptFooter: row?.receiptFooter ?? "Terima kasih telah berbelanja",
  };

  await setCachedData(CACHE_KEY, responseData);
  return json(responseData);
}

const SettingsSchema = z.object({
  storeName: z.string().min(1).max(80),
  storeIconName: z.string().min(1).max(80),
  storeAddress: z.string().max(200).optional().default(""),
  storePhone: z.string().max(80).optional().default(""),
  receiptFooter: z.string().max(200).optional().default(""),
});

export async function POST(req: Request) {
  const { response } = await requireApiRole(req, "admin");
  if (response) return response;

  const { data, error } = await readJson<unknown>(req);
  if (error || !data) return badRequest("Invalid JSON");
  const parsed = SettingsSchema.safeParse(data);
  if (!parsed.success) return badRequest(parsed.error.message);

  const existing = await db.query.settings.findFirst({
    orderBy: (t) => [desc(t.updatedAt)],
  });

  if (!existing) {
    const [row] = await db
      .insert(settings)
      .values({
        storeName: parsed.data.storeName,
        storeIconName: parsed.data.storeIconName,
        storeAddress: parsed.data.storeAddress,
        storePhone: parsed.data.storePhone,
        receiptFooter: parsed.data.receiptFooter,
      })
      .returning();
    
    await invalidateCache(CACHE_KEY);
    return json({ updated: true, id: row?.id ?? null });
  }

  await db
    .update(settings)
    .set({
      storeName: parsed.data.storeName,
      storeIconName: parsed.data.storeIconName,
      storeAddress: parsed.data.storeAddress,
      storePhone: parsed.data.storePhone,
      receiptFooter: parsed.data.receiptFooter,
      updatedAt: new Date(),
    })
    .where(eq(settings.id, existing.id));

  await invalidateCache(CACHE_KEY);
  return json({ updated: true, id: existing.id });
}

