"use client";

import { useState } from "react";

import { BrandingSettings } from "@/components/pages/settings/BrandingSettings";
import { UsersSettings } from "@/components/pages/settings/UsersSettings";

export function SettingsClient() {
  const [tab, setTab] = useState<"branding" | "users">("branding");

  return (
    <div className="flex flex-col gap-4">
      <div className="text-lg font-semibold">Settings</div>

      <div className="flex gap-2">
        {(["branding", "users"] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={
              t === tab
                ? "rounded-full bg-zinc-900 px-4 py-2 text-sm text-white"
                : "rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm hover:bg-zinc-50"
            }
            onClick={() => setTab(t)}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === "branding" ? <BrandingSettings /> : <UsersSettings />}
    </div>
  );
}
