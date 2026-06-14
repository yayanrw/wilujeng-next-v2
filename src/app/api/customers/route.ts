import { and, asc, desc, eq, gt, gte, ilike } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { customers } from "@/db/schema";
import { badRequest, json, readJson, requireApiSession } from "@/server/api-helpers";

export async function GET(req: Request) {
  const { response } = await requireApiSession(req);
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const search = (searchParams.get("search") ?? "").trim();
  const sortBy = searchParams.get("sortBy") || "name";
  const sortOrder = searchParams.get("sortOrder") || "asc";
  const filter = searchParams.get("filter");

  const limitParam = parseInt(searchParams.get("limit") || "50", 10);
  const offsetParam = parseInt(searchParams.get("offset") || "0", 10);
  const limit = isNaN(limitParam) || limitParam <= 0 ? 50 : Math.min(limitParam, 100);
  const offset = isNaN(offsetParam) || offsetParam < 0 ? 0 : offsetParam;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const conditions = [
    eq(customers.isDeleted, false),
    ...(search ? [ilike(customers.name, `%${search}%`)] : []),
    ...(filter === "debt" ? [gt(customers.totalDebt, 0)] : []),
    ...(filter === "new_this_month" ? [gte(customers.createdAt, startOfMonth)] : []),
  ];

  const where = conditions.length === 1 ? conditions[0] : and(...conditions);

  let orderByColumn;
  switch (sortBy) {
    case "points":
      orderByColumn = customers.points;
      break;
    case "totalDebt":
      orderByColumn = customers.totalDebt;
      break;
    case "name":
    default:
      orderByColumn = customers.name;
      break;
  }

  const orderBy = sortOrder === "desc" ? desc(orderByColumn) : asc(orderByColumn);

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
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  return json(rows);
}

const CreateSchema = z.object({
  name: z.string().min(1).max(80),
  phone: z.string().max(80).optional(),
  address: z.string().max(200).optional(),
  totalDebt: z.number().int().min(0).optional().default(0),
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
      totalDebt: parsed.data.totalDebt,
    })
    .returning();

  return json(row, { status: 201 });
}

