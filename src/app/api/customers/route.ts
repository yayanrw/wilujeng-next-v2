import { asc, ilike, or } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { customers } from "@/db/schema";
import { badRequest, json, readJson, requireApiSession } from "@/server/api-helpers";

export async function GET(req: Request) {
  const { response } = await requireApiSession(req);
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const search = (searchParams.get("search") ?? "").trim();
  
  const limitParam = parseInt(searchParams.get("limit") || "50", 10);
  const offsetParam = parseInt(searchParams.get("offset") || "0", 10);
  const limit = isNaN(limitParam) || limitParam <= 0 ? 50 : Math.min(limitParam, 100);
  const offset = isNaN(offsetParam) || offsetParam < 0 ? 0 : offsetParam;

  const where = search
    ? or(ilike(customers.name, `%${search}%`), ilike(customers.phone, `%${search}%`))
    : undefined;

  const rows = await db
    .select({
      id: customers.id,
      name: customers.name,
      phone: customers.phone,
      address: customers.address,
      points: customers.points,
      totalDebt: customers.totalDebt,
    })
    .from(customers)
    .where(where)
    .orderBy(asc(customers.name))
    .limit(limit)
    .offset(offset);

  return json(rows);
}

const CreateSchema = z.object({
  name: z.string().min(1).max(80),
  phone: z.string().max(80).optional(),
  address: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  const { response } = await requireApiSession(req);
  if (response) return response;

  const { data, error } = await readJson<unknown>(req);
  if (error || !data) return badRequest("Invalid JSON");
  const parsed = CreateSchema.safeParse(data);
  if (!parsed.success) return badRequest(parsed.error.message);

  const [row] = await db
    .insert(customers)
    .values({
      name: parsed.data.name,
      phone: parsed.data.phone,
      address: parsed.data.address,
    })
    .returning();

  return json(row, { status: 201 });
}

