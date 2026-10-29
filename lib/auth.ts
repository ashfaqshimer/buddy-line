import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins";
import { Pool } from "pg";
import { DatabaseSync } from "node:sqlite";
import { getMigrations } from "better-auth/db/migration";

const databaseUrl = process.env.DATABASE_URL;
// Per Neon best practice: use unpooled connection for migrations and DDL
const unpooledUrl = process.env.DATABASE_URL_UNPOOLED || databaseUrl;

// Use Neon PostgreSQL when configured, else fallback to local SQLite
export const dbInstance = databaseUrl
  ? new Pool({ connectionString: databaseUrl })
  : new DatabaseSync("buddy_line.sqlite");

// Unpooled pool for schema migrations
export const migrationDbInstance = unpooledUrl
  ? new Pool({ connectionString: unpooledUrl })
  : dbInstance;

// Clean base URL: If set to remote neonauth by mistake, ensure local app server is used
const getBaseUrl = () => {
  const url = process.env.BETTER_AUTH_URL;
  if (!url || url.includes("neonauth")) {
    return "http://localhost:3000";
  }
  return url;
};

export const auth = betterAuth({
  database: dbInstance as Parameters<typeof betterAuth>[0]['database'],
  baseURL: getBaseUrl(),
  secret: process.env.BETTER_AUTH_SECRET || "buddy-line-secret-key-32chars-min-salt",
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  plugins: [
    username({
      minUsernameLength: 3,
      maxUsernameLength: 25,
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
