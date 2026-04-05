import type { AuthSession } from "@/lib/auth";

export type AppRole = "admin" | "cashier";

export function getRoleFromSession(session: AuthSession): AppRole {
  const role = session.user.role;
  return role === "admin" ? "admin" : "cashier";
}

export function isAdmin(session: AuthSession): boolean {
  return getRoleFromSession(session) === "admin";
}

