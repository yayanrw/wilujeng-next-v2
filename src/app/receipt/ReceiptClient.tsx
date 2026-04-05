"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/Button";

export function ReceiptClient() {
  useEffect(() => {
    const t = window.setTimeout(() => {
      window.print();
    }, 300);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="print:hidden mt-4 flex justify-center">
      <Button variant="secondary" onClick={() => window.print()}>
        Print
      </Button>
    </div>
  );
}

