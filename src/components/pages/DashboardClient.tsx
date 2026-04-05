"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { formatIdr } from "@/utils/money";

type DashboardData = {
  todaySales: number;
  lowStockCount: number;
  receivablesTotal: number;
  topSuppliers: Array<{
    supplierId: string | null;
    supplierName: string | null;
    purchaseValue: number;
    totalQty: number;
  }>;
};

export function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d: DashboardData) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load dashboard");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="text-lg font-semibold">Dashboard</div>

      {!data && !error ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          ))}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {data ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">Today sales</div>
                <div className="mt-1 text-2xl font-semibold tabular-nums">
                  {formatIdr(data.todaySales)}
                </div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">Low stock items</div>
                <div className="mt-1 text-2xl font-semibold tabular-nums">
                  {data.lowStockCount}
                </div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">Receivables</div>
                <div className="mt-1 text-2xl font-semibold tabular-nums">
                  {formatIdr(data.receivablesTotal)}
                </div>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="text-sm font-semibold">Top suppliers (last 30 days)</div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">By purchase value</div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-zinc-500 dark:text-zinc-400">
                      <th className="py-2">Supplier</th>
                      <th className="py-2">Qty</th>
                      <th className="py-2">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topSuppliers.map((s, idx) => (
                      <tr key={s.supplierId ?? s.supplierName ?? String(idx)} className="border-b border-zinc-100 dark:border-zinc-800">
                        <td className="py-2">{s.supplierName ?? "(Unknown)"}</td>
                        <td className="py-2 tabular-nums">{s.totalQty}</td>
                        <td className="py-2 tabular-nums">{formatIdr(s.purchaseValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
