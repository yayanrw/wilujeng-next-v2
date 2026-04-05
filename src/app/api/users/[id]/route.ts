import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { users } from "@/db/schema";
import { badRequest, json, notFound, readJson, requireApiRole } from "@/server/api-helpers";

const Schema = z.object({ role: z.enum(["admin", "cashier"]) });

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { response } = await requireApiRole(req, "admin");
  if (response) return response;

  const { id } = await ctx.params;
  const { data, error } = await readJson<unknown>(req);
  if (error || !data) return badRequest("Invalid JSON");
  const parsed = Schema.safeParse(data);
  if (!parsed.success) return badRequest(parsed.error.message);

  const [row] = await db
    .update(users)
    .set({ role: parsed.data.role, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();

  if (!row) return notFound("User not found");
  return json({ updated: true });
}

