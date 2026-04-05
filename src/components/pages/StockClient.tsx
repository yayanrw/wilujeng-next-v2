"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ProductPicker } from "@/components/shared/ProductPicker";
import { formatIdr } from "@/utils/money";

type Tab = "in" | "out" | "opname" | "logs";

type StockLog = {
  id: string;
  productId: string;
  type: string;
  qty: number;
  prevStock: number;
  nextStock: number;
  note: string | null;
  supplierId: string | null;
  unitBuyPrice: number | null;
  createdAt: string;
};

export function StockClient() {
  const [tab, setTab] = useState<Tab>("in");
  const [productId, setProductId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [unitBuyPrice, setUnitBuyPrice] = useState(0);
  const [supplierName, setSupplierName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [note, setNote] = useState("");
  const [logs, setLogs] = useState<StockLog[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function loadLogs() {
    const res = await fetch("/api/stock/logs");
    const body = (await res.json().catch(() => [])) as StockLog[];
    setLogs(body);
  }

  useEffect(() => {
    if (tab === "logs") void loadLogs();
  }, [tab]);

  async function submit(path: string, payload: unknown) {
    setPending(true);
    setMessage(null);
    const res = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await res.json().catch(() => null)) as
      | { prevStock: number; nextStock: number }
      | { error: { message: string } }
      | null;
    setPending(false);
    if (!res.ok) {
      setMessage(body && "error" in body ? body.error.message : "Request failed");
      return;
    }
    if (!body || !('prevStock' in body)) {
      setMessage("OK");
      return;
    }
    setMessage(`OK: stock ${body.prevStock} → ${body.nextStock}`);
    setNote("");
    if (tab === "logs") void loadLogs();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-lg font-semibold">Stock</div>

      <div className="flex flex-wrap gap-2">
        {(["in", "out", "opname", "logs"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            className={
              t === tab
                ? "rounded-full bg-zinc-900 px-4 py-2 text-sm text-white"
                : "rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm hover:bg-zinc-50"
            }
            onClick={() => setTab(t)}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {message ? (
        <div className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700">
          {message}
        </div>
      ) : null}

      {tab !== "logs" ? (
        <Card>
          <CardHeader>
            <div className="text-sm font-semibold">Stock {tab.toUpperCase()}</div>
            <div className="text-xs text-zinc-500">Choose product, enter qty, then submit</div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Product</label>
                <ProductPicker value={productId} onChange={setProductId} />
              </div>

              <div>
                <label className="text-sm font-medium">Qty</label>
                <Input value={String(qty)} onChange={(e) => setQty(Number(e.target.value) || 0)} />
              </div>

              {tab === "in" ? (
                <div>
                  <label className="text-sm font-medium">Unit buy price</label>
                  <Input value={String(unitBuyPrice)} onChange={(e) => setUnitBuyPrice(Number(e.target.value) || 0)} />
                </div>
              ) : null}

              {tab === "in" ? (
                <div>
                  <label className="text-sm font-medium">Supplier (type to create)</label>
                  <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
                </div>
              ) : null}

              {tab === "in" ? (
                <div>
                  <label className="text-sm font-medium">Expiry date (YYYY-MM-DD)</label>
                  <Input value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} placeholder="2026-12-31" />
                </div>
              ) : null}

              <div className={tab === "in" ? "md:col-span-2" : "md:col-span-2"}>
                <label className="text-sm font-medium">Note</label>
                <Input value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
            </div>

            <Button
              className="mt-3"
              disabled={pending || !productId || qty < (tab === "opname" ? 0 : 1)}
              onClick={() => {
                if (!productId) return;
                if (tab === "in") {
                  void submit("/api/stock/in", {
                    productId,
                    qty,
                    unitBuyPrice,
                    supplierName: supplierName.trim() || undefined,
                    expiryDate: expiryDate.trim() || undefined,
                    note: note.trim() || undefined,
                  });
                }
                if (tab === "out") {
                  void submit("/api/stock/out", { productId, qty, note: note.trim() || undefined });
                }
                if (tab === "opname") {
                  void submit("/api/stock/opname", { productId, qty, note: note.trim() || undefined });
                }
              }}
            >
              {pending ? "Submitting..." : "Submit"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="text-sm font-semibold">Stock logs</div>
            <div className="text-xs text-zinc-500">Latest 200 entries</div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-left text-zinc-500">
                    <th className="py-2">Type</th>
                    <th className="py-2">Qty</th>
                    <th className="py-2">Prev</th>
                    <th className="py-2">Next</th>
                    <th className="py-2">Unit buy</th>
                    <th className="py-2">Note</th>
                    <th className="py-2">At</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.id} className="border-b border-zinc-100">
                      <td className="py-2">{l.type}</td>
                      <td className="py-2 tabular-nums">{l.qty}</td>
                      <td className="py-2 tabular-nums">{l.prevStock}</td>
                      <td className="py-2 tabular-nums">{l.nextStock}</td>
                      <td className="py-2 tabular-nums">{l.unitBuyPrice ? formatIdr(l.unitBuyPrice) : ""}</td>
                      <td className="py-2 max-w-[240px] truncate">{l.note ?? ""}</td>
                      <td className="py-2">{new Date(l.createdAt).toLocaleString("id-ID")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
