import { describe, expect, it, vi, beforeEach } from "vitest";

import { POST } from "./route";

const { mockDb, mockAuth } = vi.hoisted(() => {
  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockResolvedValue([{ count: 0 }]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([]),
  };

  const mockAuth = {
    api: {
      signUpEmail: vi.fn().mockResolvedValue({ user: { id: "test-admin-id" } }),
    },
  };

  return { mockDb, mockAuth };
});

vi.mock("@/db", () => ({
  db: mockDb,
}));

vi.mock("@/db/schema", () => ({
  users: { id: "users.id" },
}));

vi.mock("drizzle-orm", () => ({
  sql: vi.fn((strings, ...values) => ({ strings, values })),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

describe("POST /api/setup-admin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.from.mockResolvedValue([{ count: 0 }]); // default: no users
    mockAuth.api.signUpEmail.mockResolvedValue({ user: { id: "test-admin-id" } });
  });

  const createRequest = (body: unknown) => {
    return new Request("http://localhost:3000/api/setup-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  it("should return 400 if setup is already complete", async () => {
    mockDb.from.mockResolvedValueOnce([{ count: 1 }]);

    const req = createRequest({});
    const res = await POST(req);
    
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.message).toBe("Setup is already complete");
  });

  it("should return 400 for invalid JSON", async () => {
    const req = new Request("http://localhost:3000/api/setup-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "invalid-json",
    });

    const res = await POST(req);
    
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.message).toBe("Invalid JSON");
  });

  it("should return 400 for validation errors (missing fields)", async () => {
    const req = createRequest({ name: "Admin" }); // missing email and password
    const res = await POST(req);
    
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.message).toBeDefined(); // zod error message
  });

  it("should return 400 if auth.signUpEmail fails", async () => {
    mockAuth.api.signUpEmail.mockResolvedValueOnce(null);

    const req = createRequest({
      name: "Admin User",
      email: "admin@example.com",
      password: "password123",
    });
    const res = await POST(req);
    
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.message).toBe("Failed to create admin");
  });

  it("should create admin user and return 200 on success", async () => {
    const req = createRequest({
      name: "Admin User",
      email: "admin@example.com",
      password: "password123",
    });
    const res = await POST(req);
    
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.created).toBe(true);

    expect(mockAuth.api.signUpEmail).toHaveBeenCalledWith({
      body: {
        email: "admin@example.com",
        password: "password123",
        name: "Admin User",
        role: "admin",
      },
    });

    expect(mockDb.update).toHaveBeenCalled();
    expect(mockDb.set).toHaveBeenCalledWith({ role: "admin", updatedAt: expect.any(Date) });
    expect(mockDb.where).toHaveBeenCalled();
  });
});
