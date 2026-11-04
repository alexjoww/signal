# Signal

Lightweight org feedback triage. Data and users live in **Supabase Postgres**. The app only needs one secret: `DATABASE_URL`.

## Setup

1. Create a Supabase project.
2. Set the secret:

```bash
cp .env.example .env.local
```

`DATABASE_URL` — from **Project Settings → Database → Connect → URI**  
(prefer the **pooler** URI on port `6543`).

3. Apply schema in the Supabase **SQL Editor**:

- [`supabase/migrations/20261104000000_init.sql`](supabase/migrations/20261104000000_init.sql)
- [`supabase/migrations/20261104000002_app_auth.sql`](supabase/migrations/20261104000002_app_auth.sql) (if you already ran an older migration)

4. Seed demo users:

```bash
npm install
npm run db:seed
```

5. Run:

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

Promote admins with:

```sql
update profiles set role = 'admin' where email = 'you@acme.co';
```

## Stack

Next.js App Router · React 19 · Tailwind CSS 4 · Supabase Postgres (`pg`) · cookie sessions
