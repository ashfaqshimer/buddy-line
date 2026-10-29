import { auth, ensureAuthMigrations } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest } from "next/server";

const handlers = toNextJsHandler(auth);

export async function GET(req: NextRequest) {
  await ensureAuthMigrations();
  return handlers.GET(req);
}

export async function POST(req: NextRequest) {
  await ensureAuthMigrations();
  return handlers.POST(req);
}

