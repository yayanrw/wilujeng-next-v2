"use client";

import type { InputHTMLAttributes } from "react";
import { forwardRef } from "react";

import { cn } from "@/lib/cn";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
