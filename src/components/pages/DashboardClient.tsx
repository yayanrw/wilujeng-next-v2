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
import CountUp from 'react-countup';

import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { formatIdr } from '@/utils/money';
import { useTranslation } from '@/i18n/useTranslation';

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
  const { t } = useTranslation();

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
        <div className="text-xl font-bold tracking-tight">
          {t.dashboard.title}
        </div>
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          {t.dashboard.subtitle}
        </div>
      </div>

      {!data && !error ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-4 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-5 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="mt-2 h-4 w-64 rounded bg-zinc-200 dark:bg-zinc-800" />
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full rounded bg-zinc-200/50 dark:bg-zinc-800/50" />
            </CardContent>
          </Card>
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
                  {t.dashboard.todayTransactions}
                </div>
                <ShoppingCart className="h-4 w-4 text-zinc-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums tracking-tight">
                  <CountUp
                    end={data.todayTransactionCount}
                    duration={1.5}
                    separator="."
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {t.dashboard.todaySales}
                </div>
                <TrendingUp className="h-4 w-4 text-zinc-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums tracking-tight">
                  <CountUp
                    prefix="Rp"
                    end={data.todaySales}
                    duration={1.5}
                    separator="."
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {t.dashboard.todayNetProfit}
                </div>
                <Banknote className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums tracking-tight text-emerald-600 dark:text-emerald-400">
                  <CountUp
                    prefix="Rp"
                    end={data.todayGrossProfit}
                    duration={1.5}
                    separator="."
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {t.dashboard.lowStockItems}
                </div>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums tracking-tight">
                  <CountUp
                    end={data.lowStockCount}
                    duration={1.5}
                    separator="."
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {t.dashboard.receivables}
                </div>
                <Users className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums tracking-tight text-red-600 dark:text-red-400">
                  <CountUp
                    prefix="Rp"
                    end={data.receivablesTotal}
                    duration={1.5}
                    separator="."
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <div className="text-sm font-semibold">
                  {t.dashboard.salesProfitOverview}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {t.dashboard.revenueVsProfit}
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
                    {t.dashboard[filter]}
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
                      name={t.reports.totalSales}
                      stroke="#18181b"
                      fillOpacity={1}
                      fill="url(#colorSales)"
                      className="dark:stroke-zinc-100"
                    />
                    <Area
                      type="monotone"
                      dataKey="grossProfit"
                      name={t.dashboard.netProfit}
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
                  {t.dashboard.lowStockItems}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {t.dashboard.itemsNeedRestock}
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-y border-zinc-200 bg-zinc-50/50 text-left text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
                        <th className="px-4 py-2 font-medium">
                          {t.dashboard.product}
                        </th>
                        <th className="px-4 py-2 font-medium text-right">
                          {t.dashboard.stock}
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
                            {t.dashboard.noLowStock}
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
                  {t.dashboard.topReceivables}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {t.dashboard.customersHighestDebt}
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-y border-zinc-200 bg-zinc-50/50 text-left text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
                        <th className="px-4 py-2 font-medium">
                          {t.dashboard.customer}
                        </th>
                        <th className="px-4 py-2 font-medium text-right">
                          {t.dashboard.debt}
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
                            {t.dashboard.noReceivables}
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
                  {t.dashboard.topSalesProducts}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {t.dashboard.bestSelling}
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-y border-zinc-200 bg-zinc-50/50 text-left text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
                        <th className="px-4 py-2 font-medium">
                          {t.dashboard.product}
                        </th>
                        <th className="px-4 py-2 font-medium text-right">
                          {t.dashboard.soldQty}
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
                            {t.dashboard.noSalesData}
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
                  {t.dashboard.topSuppliers}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {t.dashboard.byPurchaseValue}
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-y border-zinc-200 bg-zinc-50/50 text-left text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
                        <th className="px-4 py-2 font-medium">
                          {t.dashboard.supplier}
                        </th>
                        <th className="px-4 py-2 font-medium text-right">
                          {t.dashboard.value}
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
                            {t.dashboard.noSupplierData}
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
