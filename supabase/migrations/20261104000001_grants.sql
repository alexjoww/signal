-- Fix: grant API roles access to Signal tables (safe to re-run)

grant usage on schema public to postgres, anon, authenticated, service_role;

grant all on table public.profiles to postgres, anon, authenticated, service_role;
grant all on table public.feedback to postgres, anon, authenticated, service_role;
grant all on table public.comments to postgres, anon, authenticated, service_role;

grant all on all sequences in schema public to postgres, anon, authenticated, service_role;
grant execute on function public.is_admin() to anon, authenticated, service_role;
