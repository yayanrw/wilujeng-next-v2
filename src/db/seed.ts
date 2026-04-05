import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users } from './schema';
import { eq } from 'drizzle-orm';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('Missing DATABASE_URL');
}

const secret = process.env.BETTER_AUTH_SECRET;
if (!secret) {
  throw new Error('Missing BETTER_AUTH_SECRET');
}

const queryClient = postgres(databaseUrl, { prepare: false });
const db = drizzle(queryClient, { schema });

// Initialize an isolated auth instance for the script to use the adapter functions
const auth = betterAuth({
  secret,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verificationTokens,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'cashier',
      },
    },
  },
});

async function main() {
  console.log('Seeding database...');

  const adminEmail = 'admin@example.com';
  const adminPassword = 'password123';

  try {
    const existingAdmins = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail));

    if (existingAdmins.length > 0) {
      console.log(
        `Admin user with email ${adminEmail} already exists. Cleaning up old record to ensure fresh credentials...`,
      );
      // Clean up old record if it exists so we can re-create it properly
      await db
        .delete(schema.accounts)
        .where(eq(schema.accounts.accountId, adminEmail));
      await db.delete(users).where(eq(users.email, adminEmail));
    }

    console.log(`Creating dummy admin user: ${adminEmail}`);

    const authInstance = auth;

    // As a reliable fallback for seeding if Better Auth adapter has issues with raw timestamp modes
    // we'll use direct Drizzle insertion, which is perfectly safe for a seeder script.

    // Better auth uses bcrypt under the hood for the email/password provider by default.
    // We can just use an API endpoint to sign up so it handles the password hashing correctly.
    // Wait, the API endpoint is what is failing. Let's just mock the request logic.
    // Actually, better-auth exports password hashing utils.

    // Since this is just a dummy seeder, we will import bcrypt directly if needed, or better,
    // we can just use the internal auth object which contains the password module.

    // Let's create the user via the internal method if possible, or just generate a bcrypt hash.
    // Since we don't have bcrypt directly in package.json, let's use the node crypto module for a simple workaround
    // or just let the API fail and we fix the API failure.

    // The API failure is: TypeError: value.toISOString is not a function
    // This happens because Drizzle returns a string from Postgres for timestamp fields,
    // but better-auth expects a Date object, or vice versa.

    // Let's fix this by adding a custom hook or just fixing the Drizzle schema mode to "string"
    // Since we are just seeding here, we can use the native fetch to hit the /api/setup-admin route!
    // But the server might not be running. Let's use the local API route directly.

    // Better yet, let's just use simple Drizzle insertion with a dummy password that we'll manually reset,
    // or just use Better Auth's password hash utility.

    const { hashPassword } = await import('better-auth/crypto');
    const hashedPassword = await hashPassword(adminPassword);

    const [newUser] = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        email: adminEmail,
        name: 'Dummy Admin',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: true, // Important: mark as verified so better-auth doesn't block login
      })
      .returning();

    if (newUser) {
      await db.insert(schema.accounts).values({
        id: crypto.randomUUID(),
        userId: newUser.id,
        type: 'email',
        providerId: 'credential', // Better Auth uses 'credential' instead of 'email' for email/password auth provider matching
        accountId: adminEmail,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log('✅ Admin user seeded successfully!');
      console.log(`Email: ${adminEmail}`);
      console.log(`Password: ${adminPassword}`);
    } else {
      console.error('❌ Failed to create admin user.');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await queryClient.end();
  }
}

main();
