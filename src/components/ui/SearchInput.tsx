"use client";

import type { InputHTMLAttributes } from "react";
import { forwardRef } from "react";
import { Search } from "lucide-react";

import { cn } from "@/lib/cn";
import { Input } from "./Input";

export const SearchInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & {
    wrapperClassName?: string;
  }
>(({ className, wrapperClassName, ...props }, ref) => {
  return (
    <div className={cn("relative", wrapperClassName)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
      <Input
        ref={ref}
        className={cn("pl-9", className)}
        {...props}
      />
    </div>
  );
});

SearchInput.displayName = "SearchInput";
