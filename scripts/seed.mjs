#!/usr/bin/env node
/**
 * Seeds demo users + sample feedback.
 * Requires: DATABASE_URL
 *
 * Usage: npm run db:seed
 */
import bcrypt from "bcryptjs";
import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local", override: true });
config({ override: false });

function normalizeDatabaseUrl(raw) {
  let url = String(raw || "").trim();
  if (url.startsWith("postgres://")) {
    url = "postgresql://" + url.slice("postgres://".length);
  }
  try {
    const parsed = new URL(url);
    const dbHost = parsed.hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/i);
    if (dbHost && (!parsed.port || parsed.port === "5432")) {
      const ref = dbHost[1].toLowerCase();
      parsed.hostname = "aws-0-us-east-2.pooler.supabase.com";
      parsed.port = "6543";
      parsed.username = `postgres.${ref}`;
      parsed.searchParams.set("sslmode", "require");
      return parsed.toString();
    }
  } catch {
    // keep
  }
  return url;
}

const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);
if (!databaseUrl) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});
// pg may still validate via sslmode in the URI on some versions
process.env.NODE_TLS_REJECT_UNAUTHORIZED =
  process.env.NODE_TLS_REJECT_UNAUTHORIZED || "0";

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

async function ensureUser(client, demo) {
  const passwordHash = await bcrypt.hash(demo.password, 10);
  const existing = await client.query(
    `select id from profiles where email = $1`,
    [demo.email],
  );
  if (existing.rowCount) {
    await client.query(
      `update profiles
       set name = $2, role = $3, password_hash = $4
       where email = $1`,
      [demo.email, demo.name, demo.role, passwordHash],
    );
    return existing.rows[0].id;
  }
  const inserted = await client.query(
    `insert into profiles (name, email, role, password_hash)
     values ($1, $2, $3, $4)
     returning id`,
    [demo.name, demo.email, demo.role, passwordHash],
  );
  return inserted.rows[0].id;
}

async function main() {
  const client = await pool.connect();
  try {
    console.log("Applying app-auth migration bits…");
    await client.query(`
      alter table public.profiles add column if not exists password_hash text;
      alter table public.profiles alter column id set default gen_random_uuid();
      alter table public.profiles disable row level security;
      alter table public.feedback disable row level security;
      alter table public.comments disable row level security;
    `);
    // drop FKs from profiles → auth.users if any
    await client.query(`
      do $$
      declare r record;
      begin
        for r in
          select conname from pg_constraint
          where conrelid = 'public.profiles'::regclass and contype = 'f'
        loop
          execute format('alter table public.profiles drop constraint %I', r.conname);
        end loop;
      end $$;
    `);

    console.log("Seeding Signal demo users…");
    const ids = {};
    for (const demo of DEMO_USERS) {
      ids[demo.email] = await ensureUser(client, demo);
      console.log(`  ✓ ${demo.email} (${demo.role})`);
    }

    const countRes = await client.query(`select count(*)::int as c from feedback`);
    if (countRes.rows[0].c === 0) {
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
        },
      ];

      for (const s of samples) {
        await client.query(
          `insert into feedback
            (title, body, type, status, team, product_area, author_id, created_at, updated_at)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$8)`,
          [
            s.title,
            s.body,
            s.type,
            s.status,
            s.team,
            s.product_area,
            s.author_id,
            s.created_at,
          ],
        );
      }

      const apple = await client.query(
        `select id from feedback where title like 'Checkout fails%' limit 1`,
      );
      if (apple.rowCount) {
        await client.query(
          `insert into comments (feedback_id, author_id, body, created_at)
           values ($1, $2, $3, $4)`,
          [
            apple.rows[0].id,
            ids["sam@acme.co"],
            "Reproduced — looks tied to the payment sheet handshake. Pulling into this sprint.",
            new Date(now - 20 * 3600_000).toISOString(),
          ],
        );
      }
      console.log(`  ✓ ${samples.length} feedback items`);
    } else {
      console.log(
        `Feedback already present (${countRes.rows[0].c}); skipping sample rows.`,
      );
    }

    console.log("\nDemo logins (password for all): signal-demo-1");
    for (const u of DEMO_USERS) {
      console.log(`  ${u.email} · ${u.role}`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
