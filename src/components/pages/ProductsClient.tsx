"use client";

import { useEffect, useMemo, useState } from "react";

import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { formatIdr } from "@/utils/money";

import { ProductForm, type ProductDto } from "./products/ProductForm";

export function ProductsClient() {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [loading, setLoading] = useState(false);

  const selected = useMemo(
    () => (selectedId ? products.find((p) => p.id === selectedId) ?? null : null),
    [products, selectedId],
  );

  async function refresh() {
    setLoading(true);
    const res = await fetch(`/api/products?search=${encodeURIComponent(search)}`);
    const body = (await res.json().catch(() => [])) as ProductDto[];
    setProducts(body);
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => void refresh(), 250);
    return () => window.clearTimeout(t);
  }, [search]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_420px]">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">Products</div>
              <div className="text-sm text-zinc-500">Create and edit products and tiers</div>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                setMode("create");
                setSelectedId(null);
              }}
            >
              <Plus className="h-4 w-4" />
              New
            </Button>
          </div>
          <div className="mt-3">
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-zinc-500">
                  <th className="py-2">SKU</th>
                  <th className="py-2">Name</th>
                  <th className="py-2">Price</th>
                  <th className="py-2">Stock</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr
                    key={p.id}
                    className={
                      p.id === selectedId
                        ? "border-b border-zinc-100 bg-zinc-50"
                        : "border-b border-zinc-100 hover:bg-zinc-50"
                    }
                  >
                    <td className="py-2">
                      <button
                        type="button"
                        className="font-mono text-xs text-zinc-700 hover:text-zinc-900"
                        onClick={() => {
                          setSelectedId(p.id);
                          setMode("edit");
                        }}
                      >
                        {p.sku}
                      </button>
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{p.name}</span>
                        {p.minStockThreshold > 0 && p.stock <= p.minStockThreshold ? (
                          <Badge tone="warning">Low</Badge>
                        ) : null}
                      </div>
                      <div className="mt-1 flex gap-2 text-xs text-zinc-500">
                        {p.category ? <span>{p.category.name}</span> : null}
                        {p.brand ? <span>{p.brand.name}</span> : null}
                      </div>
                    </td>
                    <td className="py-2 tabular-nums">{formatIdr(p.basePrice)}</td>
                    <td className="py-2 tabular-nums">{p.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {loading ? <div className="mt-3 text-sm text-zinc-500">Loading...</div> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="text-sm font-semibold">{mode === "create" ? "New product" : "Edit product"}</div>
          <div className="text-xs text-zinc-500">Admin only</div>
        </CardHeader>
        <CardContent>
          <ProductForm
            mode={mode}
            initial={mode === "edit" ? selected ?? undefined : undefined}
            onSaved={async () => {
              await refresh();
              if (mode === "create") setMode("create");
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

