import { describe, expect, it, vi } from 'vitest';

vi.stubEnv('BETTER_AUTH_SECRET', 'dummy');
vi.mock('@/db', () => ({ db: {} }));
vi.mock('server-only', () => ({}));

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db';
import { users, sessions, accounts, verificationTokens } from '@/db/schema';

describe('Better Auth Drizzle Adapter Configuration', () => {
  it('should not throw when schema has correct singular keys', async () => {
    const auth = betterAuth({
      database: drizzleAdapter(db, {
        provider: 'pg',
        schema: {
          user: users,
          session: sessions,
          account: accounts,
          verification: verificationTokens,
        },
      }),
      user: {
        additionalFields: {
          role: {
            type: 'string',
            defaultValue: 'cashier',
          },
        },
      },
    });

    // Just ensure it doesn't throw on initialization or options extraction
    expect(auth.options).toBeDefined();
  });
});
