import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { badRequest, json, readJson, requireApiRole } from "@/server/api-helpers";

export async function GET(req: Request) {
  const { response } = await requireApiRole(req, "admin");
  if (response) return response;

  const rows = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt })
    .from(users)
    .orderBy(asc(users.email))
    .limit(200);

  return json(rows);
}

const CreateSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email().max(120),
  password: z.string().min(8).max(200),
  role: z.enum(["admin", "cashier"]).default("cashier"),
});

export async function POST(req: Request) {
  const { response } = await requireApiRole(req, "admin");
  if (response) return response;

  const { data, error } = await readJson<unknown>(req);
  if (error || !data) return badRequest("Invalid JSON");
  const parsed = CreateSchema.safeParse(data);
  if (!parsed.success) return badRequest(parsed.error.message);

  const result = await auth.api.signUpEmail({
    body: {
      email: parsed.data.email,
      password: parsed.data.password,
      name: parsed.data.name,
      role: parsed.data.role,
    } as never,
  });

  if (!result?.user?.id) {
    const existing = await db.query.users.findFirst({
      where: (t, { eq: eq2 }) => eq2(t.email, parsed.data.email),
    });
    if (existing) return badRequest("User already exists");
    return badRequest("Failed to create user");
  }

  await db.update(users).set({ role: parsed.data.role, updatedAt: new Date() }).where(eq(users.id, result.user.id));
  return json({ id: result.user.id }, { status: 201 });
}

