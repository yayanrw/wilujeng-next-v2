import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { hashPassword } from 'better-auth/crypto';

import { db } from '@/db';
import { users, accounts } from '@/db/schema';
import {
  badRequest,
  json,
  notFound,
  readJson,
  requireApiSession,
} from '@/server/api-helpers';

const Schema = z.object({
  name: z.string().min(1).max(80),
  password: z.string().min(8).max(200).optional().or(z.literal('')),
});

export async function GET(req: Request) {
  const { session, response } = await requireApiSession(req);
  if (response) return response;

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: {
      id: true,
      name: true,
      email: true,
      role: true,
    }
  });

  if (!user) return notFound('User not found');
  return json(user);
}

export async function PATCH(req: Request) {
  const { session, response } = await requireApiSession(req);
  if (response) return response;

  const { data, error } = await readJson<unknown>(req);
  if (error || !data) return badRequest('Invalid JSON');
  const parsed = Schema.safeParse(data);
  if (!parsed.success) return badRequest(parsed.error.message);

  await db.transaction(async (tx) => {
    // Update name
    await tx
      .update(users)
      .set({
        name: parsed.data.name,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    // Update password if provided
    if (parsed.data.password && parsed.data.password.length > 0) {
      const hashedPassword = await hashPassword(parsed.data.password);
      await tx
        .update(accounts)
        .set({
          password: hashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(accounts.userId, session.user.id));
    }
  });

  return json({ updated: true });
}
