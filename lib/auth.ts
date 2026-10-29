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

// Guard against uncaught termination errors on idle pool connections (e.g. Neon scale-to-zero)
if (dbInstance instanceof Pool) {
  dbInstance.on('error', (err) => {
    console.warn('Neon Postgres idle client pool notice (dbInstance):', err?.message || err);
  });
}

if (migrationDbInstance instanceof Pool && migrationDbInstance !== dbInstance) {
  migrationDbInstance.on('error', (err) => {
    console.warn('Neon Postgres idle client pool notice (migrationDbInstance):', err?.message || err);
  });
}

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

export const isRootUser = (
  user?: { email?: string | null; username?: string | null; role?: string | null } | null
): boolean => {
  if (!user) return false;
  if (user.role?.toLowerCase() === 'root') return true;

  const rootTarget = (process.env.ROOT_USER || "").trim().toLowerCase();
  const rootEmails = (process.env.ROOT_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const email = (user.email || "").trim().toLowerCase();
  const username = (user.username || "").trim().toLowerCase();

  if (rootTarget && ((email !== "" && email === rootTarget) || (username !== "" && username === rootTarget))) {
    return true;
  }
  if (email !== "" && rootEmails.includes(email)) {
    return true;
  }
  // Standard root user convention
  if (username === "root" || email === "root" || email === "root@buddyline.local" || email === "root@buddyline.com") {
    return true;
  }
  return false;
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
          if (isRootUser(user)) {
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
