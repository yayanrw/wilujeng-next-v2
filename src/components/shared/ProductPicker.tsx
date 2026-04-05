"use client";

import { useEffect, useMemo, useState } from "react";

import { Input } from "@/components/ui/Input";

type ProductOption = { id: string; sku: string; name: string; stock: number };
type ProductRow = { id: string; sku: string; name: string; stock: number };

export function ProductPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<ProductOption[]>([]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setOptions([]);
      return;
    }
    let cancelled = false;
    void fetch(`/api/products?search=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((rows: ProductRow[]) => {
        if (cancelled) return;
        const opts = rows.slice(0, 10).map((p) => ({
          id: p.id,
          sku: p.sku,
          name: p.name,
          stock: p.stock,
        }));
        setOptions(opts);
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  const selected = useMemo(() => options.find((o) => o.id === value) ?? null, [options, value]);

  return (
    <div className="flex flex-col gap-2">
      <Input placeholder="Search product by name or SKU" value={query} onChange={(e) => setQuery(e.target.value)} />
      {value ? (
        <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm">
          <div className="min-w-0">
            <div className="truncate font-medium">{selected?.name ?? value}</div>
            <div className="text-xs text-zinc-500">{selected?.sku ?? ""}</div>
          </div>
          <button
            type="button"
            className="rounded-md px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100"
            onClick={() => onChange(null)}
          >
            Clear
          </button>
        </div>
      ) : null}

      {options.length ? (
        <div className="max-h-48 overflow-auto rounded-lg border border-zinc-200 bg-white">
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              className="flex w-full items-center justify-between gap-2 border-b border-zinc-100 px-3 py-2 text-left text-sm hover:bg-zinc-50"
              onClick={() => {
                onChange(o.id);
                setQuery("");
                setOptions([]);
              }}
            >
              <span className="min-w-0 truncate">{o.name}</span>
              <span className="shrink-0 font-mono text-xs text-zinc-500">{o.sku}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
