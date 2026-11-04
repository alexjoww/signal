-- Migrate existing Signal DBs off Supabase Auth onto app-managed passwords.
-- Safe to re-run.

alter table public.profiles
  add column if not exists password_hash text;

-- Drop FK to auth.users if present (app owns user ids now)
do $$
declare
  r record;
begin
  for r in
    select conname
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and contype = 'f'
  loop
    execute format('alter table public.profiles drop constraint %I', r.conname);
  end loop;
end $$;

-- Ensure profiles.id has a default for new signups
alter table public.profiles
  alter column id set default gen_random_uuid();

-- App enforces auth in Node; disable RLS leftovers from the Auth client era
alter table public.profiles disable row level security;
alter table public.feedback disable row level security;
alter table public.comments disable row level security;
