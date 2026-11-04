/** Public (browser) key: publishable preferred; legacy anon still accepted. */
export function getPublishableKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ""
  );
}

/** Server-only key: secret preferred; legacy service_role still accepted. */
export function getSecretKey() {
  return (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ""
  );
}

/**
 * Accept Project URL, db host, or a Postgres URI mix-up, and normalize to
 * https://<project-ref>.supabase.co.
 */
export function normalizeSupabaseUrl(raw: string) {
  let url = raw.trim().replace(/\/$/, "");

  // Accidental database connection string in the URL secret
  if (/^postgres(ql)?:\/\//i.test(url)) {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname;
      const dbHost = host.match(/^(?:db\.)?([a-z0-9]+)\.supabase\.co$/i);
      if (dbHost) {
        return `https://${dbHost[1].toLowerCase()}.supabase.co`;
      }
      const user = decodeURIComponent(parsed.username || "");
      const poolerUser = user.match(/^postgres\.([a-z0-9]+)$/i);
      if (poolerUser) {
        return `https://${poolerUser[1].toLowerCase()}.supabase.co`;
      }
    } catch {
      // fall through
    }
  }

  if (url.startsWith("db.") && url.endsWith(".supabase.co") && !url.includes("://")) {
    url = `https://${url.slice(3)}`;
  } else if (url && !/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  return url;
}

export function getSupabaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return raw ? normalizeSupabaseUrl(raw) : "";
}

export function getSupabaseEnv() {
  const url = getSupabaseUrl();
  const anonKey = getPublishableKey();

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or legacy ANON_KEY)",
    );
  }

  return { url, anonKey };
}

export function getServiceRoleKey() {
  const key = getSecretKey();
  if (!key) {
    throw new Error(
      "Missing SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY)",
    );
  }
  return key;
}

export function hasSupabaseConfig() {
  return Boolean(getSupabaseUrl() && getPublishableKey());
}
