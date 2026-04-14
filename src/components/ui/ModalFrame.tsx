"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/cn";
import { Button } from "./Button";

export function ModalFrame({
  title,
  icon,
  onClose,
  children,
  maxWidth = "lg",
  zIndex = 100,
}: {
  title: string;
  icon?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: "sm" | "lg" | "2xl";
  zIndex?: number;
}) {
  const maxWidthClass = {
    sm: "max-w-sm",
    lg: "max-w-lg",
    "2xl": "max-w-2xl",
  };

  return (
    <div
      className={cn("fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center")}
      style={{ zIndex }}
      onClick={onClose}
    >
      <div
        className={cn(
          "relative w-full mx-4 rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl animate-in fade-in zoom-in-95 duration-200",
          maxWidthClass[maxWidth],
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            {icon && <div className="text-lg">{icon}</div>}
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{title}</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
