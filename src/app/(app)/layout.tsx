import type { Metadata } from 'next';
import type { ReactNode } from "react";

import { AppShell } from "@/components/shell/AppShell";
import { getBranding } from "@/lib/branding";
import { getRoleFromSession } from "@/lib/authz";
import { requireSession } from "@/lib/server-session";

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getBranding();
  return {
    title: {
      default: branding.storeName,
      template: `%s - ${branding.storeName}`,
    },
    icons: {
      icon: [{ url: `/favicons/favicon-${branding.storeIconName}.svg`, type: 'image/svg+xml' }],
    },
  };
}

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

