import type { ReactNode } from "react";

import { AppShell } from "@/components/shell/AppShell";
import { getBranding } from "@/lib/branding";
import { getRoleFromSession } from "@/lib/authz";
import { requireSession } from "@/lib/server-session";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();
  const branding = await getBranding();

  return (
    <AppShell
      storeName={branding.storeName}
      storeIconName={branding.storeIconName}
      userName={session.user.name ?? session.user.email}
      role={getRoleFromSession(session)}
    >
      {children}
    </AppShell>
  );
}

