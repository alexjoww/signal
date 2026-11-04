-- Signal schema (Postgres only — single secret: DATABASE_URL)

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  role text not null default 'member' check (role in ('member', 'admin')),
  password_hash text,
  created_at timestamptz not null default now()
);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  type text not null check (type in ('feedback', 'feature', 'bug')),
  status text not null default 'new' check (status in ('new', 'in_progress', 'done')),
  team text,
  product_area text,
  screenshot_path text,
  author_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references public.feedback (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_feedback_status on public.feedback (status);
create index if not exists idx_feedback_team on public.feedback (team);
create index if not exists idx_feedback_product_area on public.feedback (product_area);
create index if not exists idx_comments_feedback on public.comments (feedback_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists feedback_set_updated_at on public.feedback;
create trigger feedback_set_updated_at
before update on public.feedback
for each row execute function public.set_updated_at();
