import { betterAuth } from "better-auth";
import { username, admin } from "better-auth/plugins";
import { Pool } from "pg";
import { DatabaseSync } from "node:sqlite";
import { getMigrations } from "better-auth/db/migration";

const databaseUrl = process.env.DATABASE_URL;
// Per Neon best practice: use unpooled connection for migrations and DDL
const unpooledUrl = process.env.DATABASE_URL_UNPOOLED || databaseUrl;

// In Vercel serverless functions, the root filesystem is read-only, so fallback to in-memory SQLite if DATABASE_URL is absent
const sqlitePath = process.env.VERCEL ? ":memory:" : "buddy_line.sqlite";

// Use Neon PostgreSQL when configured, else fallback to local/memory SQLite
export const dbInstance = databaseUrl
  ? new Pool({ connectionString: databaseUrl })
  : new DatabaseSync(sqlitePath);

// Unpooled pool for schema migrations
export const migrationDbInstance = unpooledUrl
  ? new Pool({ connectionString: unpooledUrl })
  : dbInstance;

// Clean base URL: Resolves correctly in local dev and automatically on Vercel deployments
const getBaseUrl = () => {
  const url = process.env.BETTER_AUTH_URL;
  if (url && !url.includes("neonauth")) {
    return url;
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
};

const getTrustedOrigins = () => {
  const origins = [
    "http://localhost:3000",
    process.env.BETTER_AUTH_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined,
  ].filter(Boolean) as string[];
  return origins;
};

export const auth = betterAuth({
  database: dbInstance as Parameters<typeof betterAuth>[0]['database'],
  baseURL: getBaseUrl(),
  trustedOrigins: getTrustedOrigins(),
  secret: process.env.BETTER_AUTH_SECRET || "buddy-line-secret-key-32chars-min-salt",
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const adminEmails = (process.env.ADMIN_EMAILS || process.env.ROOT_ADMIN_EMAILS || "")
            .split(",")
            .map((e) => e.trim().toLowerCase())
            .filter(Boolean);
          if (user.email && adminEmails.includes(user.email.toLowerCase())) {
            return {
              data: {
                ...user,
                role: "admin",
              },
            };
          }
        },
      },
    },
  },
  plugins: [
    username({
      minUsernameLength: 3,
      maxUsernameLength: 25,
    }),
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
  ],
});

// Run migrations using the direct (unpooled) Neon connection
let migrationsPromise: Promise<void> | null = null;
export async function ensureAuthMigrations() {
  if (!migrationsPromise) {
    migrationsPromise = (async () => {
      try {
        if (unpooledUrl) {
          const migrationAuth = betterAuth({
            ...auth.options,
            database: migrationDbInstance as Parameters<typeof betterAuth>[0]['database'],
          });
          const { runMigrations } = await getMigrations(migrationAuth.options);
          await runMigrations();
        } else {
          const { runMigrations } = await getMigrations(auth.options);
          await runMigrations();
        }
      } catch (err) {
        console.warn("Auth migration check warning:", err);
      }
    })();
  }
  return migrationsPromise;
}
