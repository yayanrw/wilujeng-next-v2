import 'server-only';

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';

import { db } from '@/db';
import { accounts, sessions, users, verificationTokens } from '@/db/schema';

const secret = process.env.BETTER_AUTH_SECRET;
if (!secret) {
  throw new Error('Missing BETTER_AUTH_SECRET');
}

export const auth = betterAuth({
  secret,
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verificationTokens,
    },
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'cashier',
      },
    },
  },
  plugins: [nextCookies()],
});

export type AuthSession = typeof auth.$Infer.Session;
