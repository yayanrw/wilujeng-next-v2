'use client';

import { useEffect, useState } from 'react';
import {
  TrendingUp,
  ShoppingCart,
  Banknote,
  AlertTriangle,
  Users,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { formatIdr } from '@/utils/money';

type DashboardData = {
  todaySales: number;
  todayTransactionCount: number;
  todayGrossProfit: number;
  lowStockCount: number;
  receivablesTotal: number;
  topSuppliers: Array<{
    supplierId: string | null;
    supplierName: string | null;
    purchaseValue: number;
    totalQty: number;
  }>;
  topReceivables: Array<{
    id: string;
    name: string;
    totalDebt: number;
  }>;
  lowStockItems: Array<{
    id: string;
    name: string;
    sku: string;
    stock: number;
    minStockThreshold: number;
  }>;
  topSalesProducts: Array<{
    productId: string;
    productName: string;
    productSku: string;
    totalQty: number;
    totalSales: number;
  }>;
  pnlChartData: Array<{
    date: string;
    sales: number;
    grossProfit: number;
  }>;
};

export function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chartFilter, setChartFilter] = useState<
    'daily' | 'weekly' | 'monthly'
  >('daily');

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/dashboard?filter=${chartFilter}`)
      .then((r) => r.json())
      .then((d: DashboardData) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load dashboard');
      });
    return () => {
      cancelled = true;
    };
  }, [chartFilter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <div className="text-xl font-bold tracking-tight">Dashboard</div>
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          Executive summary and business overview
        </div>
      </div>

      {!data && !error ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800"
            />
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Today Transactions
                </div>
                <ShoppingCart className="h-4 w-4 text-zinc-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums tracking-tight">
                  {data.todayTransactionCount}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Today Sales
                </div>
                <TrendingUp className="h-4 w-4 text-zinc-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums tracking-tight">
                  {formatIdr(data.todaySales)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Today Gross Profit
                </div>
                <Banknote className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums tracking-tight text-emerald-600 dark:text-emerald-400">
                  {formatIdr(data.todayGrossProfit)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Low Stock Items
                </div>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums tracking-tight">
                  {data.lowStockCount}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Receivables
                </div>
                <Users className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums tracking-tight text-red-600 dark:text-red-400">
                  {formatIdr(data.receivablesTotal)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <div className="text-sm font-semibold">
                  Sales & Profit Overview
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  Revenue vs Gross Profit over time
                </div>
              </div>
              <div className="flex gap-2">
                {(['daily', 'weekly', 'monthly'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setChartFilter(filter)}
                    className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                      chartFilter === filter
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data.pnlChartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorSales"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#18181b"
                          stopOpacity={0.3}
                          className="dark:stopColor-zinc-100"
                        />
                        <stop
                          offset="95%"
                          stopColor="#18181b"
                          stopOpacity={0}
                          className="dark:stopColor-zinc-100"
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorProfit"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e4e4e7"
                      className="dark:stroke-zinc-800"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: '#71717a' }}
                      axisLine={false}
                      tickLine={false}
                      dy={10}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#71717a' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val: number) =>
                        `Rp${(val / 1000000).toFixed(0)}M`
                      }
                    />
                    <Tooltip
                      cursor={{
                        stroke: '#a1a1aa',
                        strokeWidth: 1,
                        strokeDasharray: '3 3',
                      }}
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                      formatter={(value: unknown) => [
                        formatIdr(Number(value) || 0),
                        '',
                      ]}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      name="Total Sales"
                      stroke="#18181b"
                      fillOpacity={1}
                      fill="url(#colorSales)"
                      className="dark:stroke-zinc-100"
                    />
                    <Area
                      type="monotone"
                      dataKey="grossProfit"
                      name="Gross Profit"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#colorProfit)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="flex flex-col">
              <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 pb-4">
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Low Stock Items
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  Items that need to be restocked
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-y border-zinc-200 bg-zinc-50/50 text-left text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
                        <th className="px-4 py-2 font-medium">Product</th>
                        <th className="px-4 py-2 font-medium text-right">
                          Stock
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {data.lowStockItems.length === 0 ? (
                        <tr>
                          <td
                            colSpan={2}
                            className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400"
                          >
                            No low stock items.
                          </td>
                        </tr>
                      ) : (
                        data.lowStockItems.map((item) => (
                          <tr
                            key={item.id}
                            className="group transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50"
                          >
                            <td className="px-4 py-2">
                              <div className="font-medium text-zinc-900 dark:text-zinc-100">
                                {item.name}
                              </div>
                              <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                                {item.sku}
                              </div>
                            </td>
                            <td className="px-4 py-2 text-right">
                              <div className="tabular-nums font-semibold text-red-600 dark:text-red-400">
                                {item.stock}
                              </div>
                              <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                                Min: {item.minStockThreshold}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col">
              <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 pb-4">
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Top Receivables
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  Customers with highest outstanding debt
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-y border-zinc-200 bg-zinc-50/50 text-left text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
                        <th className="px-4 py-2 font-medium">Customer</th>
                        <th className="px-4 py-2 font-medium text-right">
                          Debt
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {data.topReceivables.length === 0 ? (
                        <tr>
                          <td
                            colSpan={2}
                            className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400"
                          >
                            No outstanding receivables.
                          </td>
                        </tr>
                      ) : (
                        data.topReceivables.map((customer) => (
                          <tr
                            key={customer.id}
                            className="group transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50"
                          >
                            <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                              {customer.name}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums font-semibold text-red-600 dark:text-red-400">
                              {formatIdr(customer.totalDebt)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col">
              <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 pb-4">
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Top Sales Products
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  Best selling products all time
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-y border-zinc-200 bg-zinc-50/50 text-left text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
                        <th className="px-4 py-2 font-medium">Product</th>
                        <th className="px-4 py-2 font-medium text-right">
                          Sold Qty
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {data.topSalesProducts.length === 0 ? (
                        <tr>
                          <td
                            colSpan={2}
                            className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400"
                          >
                            No sales data.
                          </td>
                        </tr>
                      ) : (
                        data.topSalesProducts.map((product) => (
                          <tr
                            key={product.productId}
                            className="group transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50"
                          >
                            <td className="px-4 py-2">
                              <div className="font-medium text-zinc-900 dark:text-zinc-100">
                                {product.productName}
                              </div>
                              <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                                {product.productSku}
                              </div>
                            </td>
                            <td className="px-4 py-2 text-right tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                              {product.totalQty}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col">
              <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 pb-4">
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Top Suppliers (last 30 days)
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  By purchase value
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-y border-zinc-200 bg-zinc-50/50 text-left text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
                        <th className="px-4 py-2 font-medium">Supplier</th>
                        <th className="px-4 py-2 font-medium text-right">
                          Value
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {data.topSuppliers.length === 0 ? (
                        <tr>
                          <td
                            colSpan={2}
                            className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400"
                          >
                            No supplier data.
                          </td>
                        </tr>
                      ) : (
                        data.topSuppliers.map((s, idx) => (
                          <tr
                            key={s.supplierId ?? s.supplierName ?? String(idx)}
                            className="group transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50"
                          >
                            <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                              {s.supplierName ?? '(Unknown)'}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums font-semibold text-zinc-900 dark:text-zinc-100">
                              {formatIdr(s.purchaseValue)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
