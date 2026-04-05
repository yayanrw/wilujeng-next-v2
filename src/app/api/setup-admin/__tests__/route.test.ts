import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { db } from '@/db';
import { users, accounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

describe('POST /api/setup-admin', () => {
  beforeEach(async () => {
    await db
      .delete(accounts)
      .where(eq(accounts.accountId, 'testadmin@example.com'));
    await db.delete(users).where(eq(users.email, 'testadmin@example.com'));
  });

  it('should successfully create an admin user and be able to sign in', async () => {
    const selectSpy = vi.spyOn(db, 'select').mockReturnValue({
      from: vi.fn().mockResolvedValue([{ count: 0 }]),
    } as any);

    const req = new Request('http://localhost/api/setup-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Admin',
        email: 'testadmin@example.com',
        password: 'password123',
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.created).toBe(true);

    selectSpy.mockRestore();

    // Now let's try to sign in using better-auth
    try {
      const signInResponse = await auth.api.signInEmail({
        body: {
          email: 'testadmin@example.com',
          password: 'password123',
        } as any,
        headers: new Headers(),
      });
      console.log('Sign in successful!', signInResponse);
      expect(signInResponse.token).toBeDefined();
    } catch (e) {
      console.error('Sign in failed:', e);
      throw e;
    }
  });
});
