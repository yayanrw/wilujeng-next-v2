import type { Metadata } from 'next';
import { SettingsClient } from "@/components/pages/SettingsClient";
import { requireAdmin } from "@/lib/server-session";

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  await requireAdmin();
  return <SettingsClient />;
}

