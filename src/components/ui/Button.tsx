"use client";

import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variantClass: Record<Variant, string> = {
  primary:
    "bg-zinc-900 text-white hover:bg-zinc-800 focus-visible:ring-zinc-400",
  secondary:
    "bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50 focus-visible:ring-zinc-300",
  ghost: "bg-transparent text-zinc-900 hover:bg-zinc-100 focus-visible:ring-zinc-300",
  danger: "bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-300",
};

const sizeClass: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...props}
    />
  );
}

