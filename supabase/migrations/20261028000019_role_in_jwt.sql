-- Copies profiles.role into auth.users app_metadata so the role travels
-- inside the signed JWT. The web proxy then routes by role without a
-- database round trip. profiles.role stays the source of truth; RLS
-- keeps reading it through private.auth_role().
create or replace function private.sync_role_claim()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update auth.users
     set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', new.role)
   where id = new.id;
  return new;
end;
$$;

drop trigger if exists profiles_sync_role_claim on public.profiles;
create trigger profiles_sync_role_claim
  after insert or update of role on public.profiles
  for each row execute function private.sync_role_claim();

update auth.users u
   set raw_app_meta_data = coalesce(u.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', p.role)
  from public.profiles p
 where p.id = u.id;
