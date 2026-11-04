#!/usr/bin/env node
/**
 * Seeds Supabase Auth users + sample feedback.
 * Requires env: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY
 * (legacy SUPABASE_SERVICE_ROLE_KEY also accepted)
 *
 * Usage: npm run db:seed
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local", override: true });
config({ override: false });

function normalizeSupabaseUrl(raw) {
  let url = String(raw || "")
    .trim()
    .replace(/\/$/, "");
  if (/^postgres(ql)?:\/\//i.test(url)) {
    try {
      const parsed = new URL(url);
      const dbHost = parsed.hostname.match(
        /^(?:db\.)?([a-z0-9]+)\.supabase\.co$/i,
      );
      if (dbHost) return `https://${dbHost[1].toLowerCase()}.supabase.co`;
      const user = decodeURIComponent(parsed.username || "");
      const poolerUser = user.match(/^postgres\.([a-z0-9]+)$/i);
      if (poolerUser) {
        return `https://${poolerUser[1].toLowerCase()}.supabase.co`;
      }
    } catch {
      // fall through
    }
  }
  if (
    url.startsWith("db.") &&
    url.endsWith(".supabase.co") &&
    !url.includes("://")
  ) {
    url = `https://${url.slice(3)}`;
  } else if (url && !/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  return url;
}

const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const serviceKey =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY (or SERVICE_ROLE_KEY)",
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_USERS = [
  {
    email: "maya@acme.co",
    password: "signal-demo-1",
    name: "Maya Chen",
    role: "member",
  },
  {
    email: "jordan@acme.co",
    password: "signal-demo-1",
    name: "Jordan Lee",
    role: "member",
  },
  {
    email: "sam@acme.co",
    password: "signal-demo-1",
    name: "Sam Rivera",
    role: "admin",
  },
  {
    email: "alex@acme.co",
    password: "signal-demo-1",
    name: "Alex Okonkwo",
    role: "admin",
  },
];

async function ensureUser(demo) {
  const { data: listed } = await admin.auth.admin.listUsers({ perPage: 200 });
  const existing = listed?.users?.find((u) => u.email === demo.email);

  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, {
      password: demo.password,
      email_confirm: true,
      user_metadata: { name: demo.name, role: demo.role },
    });
    await admin
      .from("profiles")
      .upsert({
        id: existing.id,
        name: demo.name,
        email: demo.email,
        role: demo.role,
      });
    return existing.id;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: demo.email,
    password: demo.password,
    email_confirm: true,
    user_metadata: { name: demo.name, role: demo.role },
  });
  if (error) throw error;

  // Trigger usually creates the profile; ensure role is correct.
  await admin.from("profiles").upsert({
    id: data.user.id,
    name: demo.name,
    email: demo.email,
    role: demo.role,
  });

  return data.user.id;
}

async function main() {
  console.log("Seeding Signal demo users…");
  const ids = {};
  for (const demo of DEMO_USERS) {
    ids[demo.email] = await ensureUser(demo);
    console.log(`  ✓ ${demo.email} (${demo.role})`);
  }

  const { count } = await admin
    .from("feedback")
    .select("id", { count: "exact", head: true });

  if ((count || 0) === 0) {
    console.log("Seeding sample feedback…");
    const now = Date.now();
    const samples = [
      {
        title: "Export CSV from the dashboard",
        body: "We keep copying rows by hand for weekly reviews. A CSV export on the main dashboard would save a lot of time.",
        type: "feature",
        status: "new",
        team: "Product",
        product_area: "Dashboard",
        author_id: ids["maya@acme.co"],
        created_at: new Date(now - 5 * 3600_000).toISOString(),
        updated_at: new Date(now - 5 * 3600_000).toISOString(),
      },
      {
        title: "Checkout fails with Apple Pay",
        body: "On Safari 18, tapping Apple Pay returns a blank modal and never completes. Reproduced on two MacBooks.",
        type: "bug",
        status: "in_progress",
        team: "Engineering",
        product_area: "Billing",
        author_id: ids["jordan@acme.co"],
        created_at: new Date(now - 26 * 3600_000).toISOString(),
        updated_at: new Date(now - 26 * 3600_000).toISOString(),
      },
      {
        title: "Onboarding feels abrupt after invite",
        body: "New hires land on an empty home screen after accepting an invite. A short tour or checklist would help.",
        type: "feedback",
        status: "done",
        team: "Design",
        product_area: "Onboarding",
        author_id: ids["maya@acme.co"],
        created_at: new Date(now - 72 * 3600_000).toISOString(),
        updated_at: new Date(now - 72 * 3600_000).toISOString(),
      },
    ];

    const { data: inserted, error } = await admin
      .from("feedback")
      .insert(samples)
      .select("id, title");
    if (error) throw error;

    const applePay = inserted.find((f) => f.title.includes("Apple Pay"));
    if (applePay) {
      await admin.from("comments").insert({
        feedback_id: applePay.id,
        author_id: ids["sam@acme.co"],
        body: "Reproduced — looks tied to the payment sheet handshake. Pulling into this sprint.",
        created_at: new Date(now - 20 * 3600_000).toISOString(),
      });
    }
    console.log(`  ✓ ${inserted.length} feedback items`);
  } else {
    console.log(`Feedback already present (${count}); skipping sample rows.`);
  }

  console.log("\nDemo logins (password for all): signal-demo-1");
  for (const u of DEMO_USERS) {
    console.log(`  ${u.email} · ${u.role}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
