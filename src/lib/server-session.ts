import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/authz";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (!isAdmin(session)) {
    redirect("/");
  }
  return session;
}

