import { createHash } from "crypto";
import { Pool, type QueryResultRow } from "pg";

let pool: Pool | null = null;

/**
 * Prefer a reachable Supabase pooler URL when given the direct db.<ref> host
 * (IPv6-only in many environments).
 */
export function normalizeDatabaseUrl(raw: string) {
  let url = raw.trim();
  if (url.startsWith("postgres://")) {
    url = "postgresql://" + url.slice("postgres://".length);
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    const dbHost = host.match(/^db\.([a-z0-9]+)\.supabase\.co$/i);
    if (dbHost && (!parsed.port || parsed.port === "5432")) {
      const ref = dbHost[1].toLowerCase();
      parsed.hostname = "aws-0-us-east-2.pooler.supabase.com";
      parsed.port = "6543";
      parsed.username = `postgres.${ref}`;
      // Transaction pooler
      parsed.searchParams.set("sslmode", "require");
      return parsed.toString();
    }
  } catch {
    // keep original
  }

  return url;
}

export function getDatabaseUrl() {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    throw new Error("Missing DATABASE_URL");
  }
  return normalizeDatabaseUrl(raw);
}

export function hasDatabaseConfig() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

/** Derive a stable session signing secret so we only need DATABASE_URL. */
export function getSessionSecret() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("Missing DATABASE_URL");
  }
  return createHash("sha256").update(`signal-session:${url}`).digest("hex");
}

export function getPool() {
  if (pool) return pool;
  // Supabase pooler presents a cert chain Node may not trust by default.
  if (!process.env.NODE_TLS_REJECT_UNAUTHORIZED) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }
  pool = new Pool({
    connectionString: getDatabaseUrl(),
    ssl: { rejectUnauthorized: false },
    max: 10,
  });
  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
) {
  return getPool().query<T>(text, params);
}
