"use client";

import { cn } from "@/lib/cn";

export function Spinner({
  size = "md",
  label,
}: {
  size?: "sm" | "md";
  label?: string;
}) {
  const sizeClass = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-100",
          sizeClass[size],
        )}
      />
      {label && <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>}
    </div>
  );
}
