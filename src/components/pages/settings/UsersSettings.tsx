"use client";

import { useEffect, useState } from "react";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
};

export function UsersSettings() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "cashier">("cashier");

  async function loadUsers() {
    const res = await fetch("/api/users");
    const body = (await res.json().catch(() => [])) as UserRow[];
    setUsers(body);
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_420px]">
      <Card>
        <CardHeader>
          <div className="text-sm font-semibold">Users</div>
          <div className="text-xs text-zinc-500">Admin can create cashiers</div>
        </CardHeader>
        <CardContent>
          {message ? (
            <div className="mb-3 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700">
              {message}
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-zinc-500">
                  <th className="py-2">Email</th>
                  <th className="py-2">Name</th>
                  <th className="py-2">Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-zinc-100">
                    <td className="py-2">{u.email}</td>
                    <td className="py-2">{u.name ?? ""}</td>
                    <td className="py-2">
                      <select
                        className="h-9 rounded-md border border-zinc-200 bg-white px-2 text-sm"
                        value={u.role}
                        onChange={async (e) => {
                          const nextRole = e.target.value;
                          setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role: nextRole } : x)));
                          await fetch(`/api/users/${u.id}`, {
                            method: "PATCH",
                            headers: { "content-type": "application/json" },
                            body: JSON.stringify({ role: nextRole }),
                          });
                          await loadUsers();
                        }}
                      >
                        <option value="admin">admin</option>
                        <option value="cashier">cashier</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="text-sm font-semibold">Create user</div>
          <div className="text-xs text-zinc-500">Email + password</div>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setPending(true);
              setMessage(null);
              const res = await fetch("/api/users", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  name: newUserName,
                  email: newUserEmail,
                  password: newUserPassword,
                  role: newUserRole,
                }),
              });
              const body = (await res.json().catch(() => null)) as
                | { id: string }
                | { error: { message: string } }
                | null;
              setPending(false);
              if (!res.ok) {
                setMessage(body && "error" in body ? body.error.message : "Failed to create user");
                return;
              }
              setMessage("User created");
              setNewUserName("");
              setNewUserEmail("");
              setNewUserPassword("");
              setNewUserRole("cashier");
              await loadUsers();
            }}
          >
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input value={newUserName} onChange={(e) => setNewUserName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <Input type="password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Role</label>
              <select
                className="h-10 w-full rounded-md border border-zinc-200 bg-white px-2 text-sm"
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value === "admin" ? "admin" : "cashier")}
              >
                <option value="cashier">cashier</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <Button type="submit" disabled={pending || !newUserEmail.trim() || newUserPassword.length < 8}>
              <Plus className="h-4 w-4" />
              {pending ? "Creating..." : "Create"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
