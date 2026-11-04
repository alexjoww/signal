# Signal

Lightweight org feedback triage backed by **Supabase** (Auth + Postgres + Storage). Anyone can submit feedback, feature requests, or bug reports (with an optional screenshot). Admins triage status, tags, and comments.

## Setup

1. Create a Supabase project and enable Email auth. For local/demo use, turn off **Confirm email** under Authentication → Providers → Email (otherwise new signups need inbox confirmation).
2. Copy env vars:

```bash
cp .env.example .env.local
```

Fill in from **Project Settings → API**:

- `NEXT_PUBLIC_SUPABASE_URL` — Project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — publishable key (`sb_publishable_…`)
- `SUPABASE_SECRET_KEY` — secret key (`sb_secret_…`, server only)

Legacy `anon` / `service_role` JWT keys are still accepted via `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`.

3. Apply the schema in the Supabase **SQL Editor** (run the full file):

[`supabase/migrations/20261104000000_init.sql`](supabase/migrations/20261104000000_init.sql)

4. Seed demo users + sample signals:

```bash
npm install
npm run db:seed
```

5. Run the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo accounts

Password for all: `signal-demo-1`

| Email | Role |
| --- | --- |
| maya@acme.co | member |
| jordan@acme.co | member |
| sam@acme.co | admin |
| alex@acme.co | admin |

Promote additional admins with:

```sql
update profiles set role = 'admin' where email = 'you@acme.co';
```

## Stack

Next.js App Router · React 19 · Tailwind CSS 4 · Supabase (Auth, Postgres, Storage)
