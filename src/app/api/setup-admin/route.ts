import { sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { badRequest, json, readJson } from "@/server/api-helpers";

const Schema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email().max(120),
  password: z.string().min(8).max(200),
});

export async function POST(req: Request) {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users);

  if ((count ?? 0) > 0) {
    return badRequest("Setup is already complete");
  }

  const { data, error } = await readJson<unknown>(req);
  if (error || !data) return badRequest("Invalid JSON");
  const parsed = Schema.safeParse(data);
  if (!parsed.success) return badRequest(parsed.error.message);

  const result = await auth.api.signUpEmail({
    body: {
      email: parsed.data.email,
      password: parsed.data.password,
      name: parsed.data.name,
      role: "admin",
    } as never,
  });

  if (!result?.user?.id) return badRequest("Failed to create admin");

  await db
    .update(users)
    .set({ role: "admin", updatedAt: new Date() })
    .where(sql`${users.id} = ${result.user.id}`);

  return json({ created: true });
}

