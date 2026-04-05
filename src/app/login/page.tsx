import { redirect } from "next/navigation";

import * as Icons from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { getBranding } from "@/lib/branding";
import { getSession } from "@/lib/server-session";

import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/");
  const branding = await getBranding();

  const Icon =
    (Icons as unknown as Record<string, (p: { className?: string }) => React.ReactNode>)[
      branding.storeIconName
    ] ?? Icons.Store;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-900 text-white">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-lg font-semibold">{branding.storeName}</div>
              <div className="truncate text-sm text-zinc-500">Sign in to continue</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}

