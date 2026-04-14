"use client";

import { cn } from "@/lib/cn";
import { Button } from "./Button";

export function TabNav({
  tabs,
  value,
  onChange,
}: {
  tabs: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <Button
          key={tab.value}
          variant={value === tab.value ? "primary" : "secondary"}
          size="sm"
          onClick={() => onChange(tab.value)}
          className={cn(
            "rounded-full px-4",
            value === tab.value && "shadow-sm",
          )}
        >
          {tab.label}
        </Button>
      ))}
    </div>
  );
}
