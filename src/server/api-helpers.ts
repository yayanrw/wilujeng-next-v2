import "server-only";

import { auth } from "@/lib/auth";
import { getRoleFromSession, type AppRole } from "@/lib/authz";

export type ApiErrorBody = { error: { message: string } };

export function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, init);
}

export function badRequest(message: string) {
  return json({ error: { message } } satisfies ApiErrorBody, { status: 400 });
}

export function unauthorized(message = "Unauthorized") {
  return json({ error: { message } } satisfies ApiErrorBody, { status: 401 });
}

export function forbidden(message = "Forbidden") {
  return json({ error: { message } } satisfies ApiErrorBody, { status: 403 });
}

export function notFound(message = "Not found") {
  return json({ error: { message } } satisfies ApiErrorBody, { status: 404 });
}

export async function getApiSession(req: Request) {
  return auth.api.getSession({ headers: req.headers });
}

export async function requireApiSession(req: Request) {
  const session = await getApiSession(req);
  if (!session) return { session: null, response: unauthorized() } as const;
  return { session, response: null } as const;
}

export async function requireApiRole(req: Request, role: AppRole) {
  const { session, response } = await requireApiSession(req);
  if (!session) return { session: null, response } as const;
  if (getRoleFromSession(session) !== role) {
    return { session: null, response: forbidden() } as const;
  }
  return { session, response: null } as const;
}

export async function readJson<T>(req: Request): Promise<{ data: T | null; error: string | null }> {
  try {
    const data = (await req.json()) as T;
    return { data, error: null };
  } catch {
    return { data: null, error: "Invalid JSON" };
  }
}

