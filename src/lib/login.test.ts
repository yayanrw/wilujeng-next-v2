import { describe, expect, it, beforeAll, afterAll, vi } from 'vitest';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

vi.mock('server-only', () => ({}));

import { db } from '@/db';
import { users, accounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

describe('Login Integration Test', () => {
  const testEmail = 'testlogin@example.com';
  const testPassword = 'password123';

  beforeAll(async () => {
    // Clean up
    await db
      .delete(accounts)
      .where(eq(accounts.accountId, testEmail))
      .catch(() => {});
    await db
      .delete(users)
      .where(eq(users.email, testEmail))
      .catch(() => {});

    // Seed
    const { hashPassword } = await import('better-auth/crypto');
    const hashedPassword = await hashPassword(testPassword);
    const [newUser] = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        email: testEmail,
        name: 'Test User',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: true,
      })
      .returning();

    await db.insert(accounts).values({
      id: crypto.randomUUID(),
      userId: newUser.id,
      type: 'email',
      providerId: 'credential',
      accountId: testEmail,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  afterAll(async () => {
    await db
      .delete(accounts)
      .where(eq(accounts.accountId, testEmail))
      .catch(() => {});
    await db
      .delete(users)
      .where(eq(users.email, testEmail))
      .catch(() => {});
  });

  it('should be able to log in with the seeded user', async () => {
    // Using Better Auth's internal API to simulate a sign-in request
    try {
      const response = await auth.api.signInEmail({
        body: {
          email: testEmail,
          password: testPassword,
        },
        headers: new Headers(),
        asResponse: true,
      });

      expect(response).toBeDefined();

      // If it returns a Response object, we can check the status
      if (response instanceof Response) {
        const data = await response.json().catch(() => ({}));
        expect(response.status).toBe(200);
        expect(data.user).toBeDefined();
        expect(data.user.email).toBe(testEmail);
      } else {
        // If it returns the raw object
        const resObj = response as unknown as { user: { email: string } };
        expect(resObj.user).toBeDefined();
        expect(resObj.user.email).toBe(testEmail);
      }
    } catch (error: unknown) {
      console.error('Login Error:', error);
      throw error; // Fail the test if an error is thrown
    }
  });
});
