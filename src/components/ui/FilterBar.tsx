"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { Button } from "./Button";
import { Spinner } from "./Spinner";

export function FilterBar({
  children,
  onApply,
  loading = false,
  applyLabel = "Apply filters",
  className,
}: {
  children: ReactNode;
  onApply?: () => void;
  loading?: boolean;
  applyLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end gap-3", className)}>
      {children}
      {onApply && (
        <Button
          onClick={onApply}
          disabled={loading}
          size="sm"
        >
          {loading ? <Spinner size="sm" /> : applyLabel}
        </Button>
      )}
    </div>
  );
}
