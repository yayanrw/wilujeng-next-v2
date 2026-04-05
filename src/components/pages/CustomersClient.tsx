"use client";

import { useEffect, useMemo, useState } from "react";

import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { formatIdr } from "@/utils/money";

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  points: number;
  totalDebt: number;
};

type CustomerDetail = {
  customer: Customer;
  transactions: Array<{
    id: string;
    totalAmount: number;
    paymentMethod: string;
    status: string;
    createdAt: string;
  }>;
};

export function CustomersClient() {
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function refreshList(q: string) {
    const res = await fetch(`/api/customers?search=${encodeURIComponent(q)}`);
    const rows = (await res.json().catch(() => [])) as Customer[];
    setCustomers(rows);
  }

  useEffect(() => {
    void refreshList("");
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => void refreshList(search), 250);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    void fetch(`/api/customers/${selectedId}`)
      .then((r) => r.json())
      .then((d: CustomerDetail) => {
        if (!cancelled) setDetail(d);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const selected = useMemo(() => customers.find((c) => c.id === selectedId) ?? null, [customers, selectedId]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_420px]">
      <Card>
        <CardHeader>
          <div className="text-lg font-semibold">Customers</div>
          <div className="mt-3">
            <Input placeholder="Search name or phone" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-zinc-500">
                  <th className="py-2">Name</th>
                  <th className="py-2">Phone</th>
                  <th className="py-2">Points</th>
                  <th className="py-2">Debt</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    className={
                      c.id === selectedId
                        ? "border-b border-zinc-100 bg-zinc-50"
                        : "border-b border-zinc-100 hover:bg-zinc-50"
                    }
                  >
                    <td className="py-2">
                      <button
                        type="button"
                        className="font-medium hover:underline"
                        onClick={() => setSelectedId(c.id)}
                      >
                        {c.name}
                      </button>
                      {c.totalDebt > 0 ? <div className="mt-1"><Badge tone="warning">Has debt</Badge></div> : null}
                    </td>
                    <td className="py-2">{c.phone ?? ""}</td>
                    <td className="py-2 tabular-nums">{c.points}</td>
                    <td className="py-2 tabular-nums">{formatIdr(c.totalDebt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="text-sm font-semibold">{selected ? "Customer detail" : "Add customer"}</div>
          <div className="text-xs text-zinc-500">Cashier and Admin</div>
        </CardHeader>
        <CardContent>
          {selected ? (
            <div className="flex flex-col gap-3">
              <div className="rounded-lg border border-zinc-200 bg-white p-3">
                <div className="text-sm font-semibold">{selected.name}</div>
                <div className="mt-1 text-sm text-zinc-600">{selected.phone ?? ""}</div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-md bg-zinc-50 p-2">
                    <div className="text-xs text-zinc-500">Points</div>
                    <div className="tabular-nums font-semibold">{selected.points}</div>
                  </div>
                  <div className="rounded-md bg-zinc-50 p-2">
                    <div className="text-xs text-zinc-500">Total debt</div>
                    <div className="tabular-nums font-semibold">{formatIdr(selected.totalDebt)}</div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold">Recent transactions</div>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 text-left text-zinc-500">
                        <th className="py-2">ID</th>
                        <th className="py-2">Total</th>
                        <th className="py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(detail?.transactions ?? []).map((t) => (
                        <tr key={t.id} className="border-b border-zinc-100">
                          <td className="py-2 font-mono text-xs">{t.id.slice(0, 8)}</td>
                          <td className="py-2 tabular-nums">{formatIdr(t.totalAmount)}</td>
                          <td className="py-2">{t.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <Button variant="secondary" onClick={() => setSelectedId(null)}>
                Back
              </Button>
            </div>
          ) : (
            <form
              className="flex flex-col gap-3"
              onSubmit={async (e) => {
                e.preventDefault();
                setMessage(null);
                const res = await fetch("/api/customers", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({
                    name: newName,
                    phone: newPhone || undefined,
                    address: newAddress || undefined,
                  }),
                });
                const body = (await res.json().catch(() => null)) as
                  | { id: string }
                  | { error: { message: string } }
                  | null;
                if (!res.ok) {
                  setMessage(body && "error" in body ? body.error.message : "Failed to create customer");
                  return;
                }
                setMessage("Customer created");
                setNewName("");
                setNewPhone("");
                setNewAddress("");
                void refreshList(search);
              }}
            >
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Address</label>
                <Input value={newAddress} onChange={(e) => setNewAddress(e.target.value)} />
              </div>
              {message ? (
                <div className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700">
                  {message}
                </div>
              ) : null}
              <Button type="submit" disabled={!newName.trim()}>
                <Plus className="h-4 w-4" />
                Create
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
