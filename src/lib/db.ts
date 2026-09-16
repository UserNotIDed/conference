import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { join } from "node:path";
import { STANDALONE } from "./mode";

/**
 * One Prisma client, cached across hot reloads in dev and across warm lambda
 * invocations in production.
 *
 * The libSQL adapter is what lets a single DATABASE_URL cover both cases:
 *   file:./prisma/dev.db   local, zero setup
 *   libsql://…             Turso, which is what survives on Vercel
 * A `file:` URL deployed to Vercel technically "works" and silently loses every
 * session between requests, so we shout about it at boot instead.
 */

/**
 * Prisma's CLI resolves a relative `file:` URL against the schema directory
 * (prisma/), while the running app would resolve it against the process cwd.
 * One env var has to mean one file, so we do what the CLI does and anchor
 * relative file URLs to prisma/. Absolute paths and libsql:// URLs pass through.
 */
function resolveUrl(raw: string): string {
  if (!raw.startsWith("file:")) return raw;
  const p = raw.slice("file:".length);
  if (p.startsWith("/")) return raw;
  return `file:${join(process.cwd(), "prisma", p)}`;
}

const url = resolveUrl(process.env.DATABASE_URL ?? "file:./dev.db");

if (
  process.env.VERCEL &&
  url.startsWith("file:") &&
  !STANDALONE &&
  process.env.ALLOW_EPHEMERAL_DB !== "1"
) {
  throw new Error(
    "DATABASE_URL is a local file but this is running on Vercel, where the " +
      "filesystem is per-invocation, so the staff screen would never see a " +
      "submission. Point DATABASE_URL at a libsql:// database (Turso) or set " +
      "ALLOW_EPHEMERAL_DB=1 if you genuinely want a throwaway.",
  );
}

function build() {
  const adapter = new PrismaLibSQL({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  return new PrismaClient({ adapter });
}

const g = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = g.prisma ?? build();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;
