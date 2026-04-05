import { SettingsClient } from "@/components/pages/SettingsClient";
import { requireAdmin } from "@/lib/server-session";

export default async function SettingsPage() {
  await requireAdmin();
  return <SettingsClient />;
}

