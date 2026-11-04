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
 * Accept Project URL, or a common mix-up (db.<ref>.supabase.co host),
 * and normalize to https://<ref>.supabase.co.
 */
export function normalizeSupabaseUrl(raw: string) {
  let url = raw.trim().replace(/\/$/, "");
  if (url.startsWith("db.") && url.endsWith(".supabase.co") && !url.includes("://")) {
    url = `https://${url.slice(3)}`;
  } else if (!/^https?:\/\//i.test(url)) {
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
