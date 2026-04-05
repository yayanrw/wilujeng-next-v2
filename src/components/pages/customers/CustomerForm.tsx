"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export type CustomerDto = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  points: number;
  totalDebt: number;
};

export function CustomerForm({
  mode,
  initial,
  onSaved,
  onCancel,
}: {
  mode: "create" | "edit";
  initial?: CustomerDto;
  onSaved: (success: boolean, errorMsg?: string) => void;
  onCancel?: () => void;
}) {
  const missingEdit = mode === "edit" && !initial;

  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [points, setPoints] = useState(initial?.points ?? 0);
  const [pending, setPending] = useState(false);

  // Sync state when initial customer changes
  useEffect(() => {
    if (mode === "edit" && initial) {
      setName(initial.name);
      setPhone(initial.phone ?? "");
      setAddress(initial.address ?? "");
      setPoints(initial.points ?? 0);
    } else if (mode === "create") {
      setName("");
      setPhone("");
      setAddress("");
      setPoints(0);
    }
  }, [initial, mode]);

  const canSave = useMemo(() => name.trim().length > 0, [name]);

  if (missingEdit) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-200 bg-white p-4 text-sm text-zinc-500">
        Select a customer to edit.
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!canSave) return;
        setPending(true);

        const payload: Record<string, unknown> = {
          name: name.trim(),
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
        };

        if (mode === "edit") {
          payload.points = points;
        }

        const res = await fetch(
          mode === "create" ? "/api/customers" : `/api/customers/${initial!.id}`,
          {
            method: mode === "create" ? "POST" : "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        const body = (await res.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        
        setPending(false);

        if (!res.ok) {
          onSaved(false, body?.error?.message ?? "Save failed");
          return;
        }

        if (mode === "create") {
          setName("");
          setPhone("");
          setAddress("");
          setPoints(0);
        }

        onSaved(true);
      }}
    >
      <div>
        <label className="text-sm font-medium">Name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="John Doe"
          className="mt-1"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Phone</label>
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="08123456789"
          className="mt-1"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Address</label>
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="123 Main St"
          className="mt-1"
        />
      </div>

      {mode === "edit" && (
        <div>
          <label className="text-sm font-medium">Loyalty Points</label>
          <div className="flex gap-2 mt-1">
            <Input
              type="number"
              min="0"
              value={String(points)}
              onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPoints(0)}
              title="Reset Points"
              className="px-3"
            >
              Reset
            </Button>
          </div>
          <p className="text-xs text-zinc-500 mt-1">Admin can reset or adjust points manually.</p>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 mt-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={pending || !canSave}>
          {pending ? "Saving..." : mode === "create" ? "Create Customer" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}