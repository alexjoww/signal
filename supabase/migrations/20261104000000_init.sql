-- Signal schema: profiles (user base), feedback, comments, storage, RLS

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null default 'member' check (role in ('member', 'admin')),
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

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'member')
  )
  on conflict (id) do update
    set name = excluded.name,
        email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.feedback enable row level security;
alter table public.comments enable row level security;

drop policy if exists "Profiles are readable by authenticated users" on public.profiles;
create policy "Profiles are readable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "Users can update their own profile name" on public.profiles;
create policy "Users can update their own profile name"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "Authenticated users can read feedback" on public.feedback;
create policy "Authenticated users can read feedback"
  on public.feedback for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can create feedback" on public.feedback;
create policy "Authenticated users can create feedback"
  on public.feedback for insert
  to authenticated
  with check (author_id = auth.uid());

drop policy if exists "Admins can update feedback" on public.feedback;
create policy "Admins can update feedback"
  on public.feedback for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Authenticated users can read comments" on public.comments;
create policy "Authenticated users can read comments"
  on public.comments for select
  to authenticated
  using (true);

drop policy if exists "Admins can create comments" on public.comments;
create policy "Admins can create comments"
  on public.comments for insert
  to authenticated
  with check (public.is_admin() and author_id = auth.uid());

insert into storage.buckets (id, name, public)
values ('screenshots', 'screenshots', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Authenticated users can upload screenshots" on storage.objects;
create policy "Authenticated users can upload screenshots"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'screenshots'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Public can read screenshots" on storage.objects;
create policy "Public can read screenshots"
  on storage.objects for select
  to public
  using (bucket_id = 'screenshots');

drop policy if exists "Users can update own screenshots" on storage.objects;
create policy "Users can update own screenshots"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'screenshots'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete own screenshots" on storage.objects;
create policy "Users can delete own screenshots"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'screenshots'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
