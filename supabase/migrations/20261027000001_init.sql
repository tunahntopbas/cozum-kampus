-- Çözüm Kampüs initial schema (docs/PROJE_REHBERI.md section 8).
-- Deviations from the guide: units is created before profiles so profiles.unit_id can reference it;
-- allowed_emails added for demo accounts outside the school domain.

create extension if not exists postgis with schema extensions;

create type user_role as enum ('student','staff','admin','security');
create type report_status as enum ('alindi','yonlendirildi','atandi','islemde','cozuldu','yeniden_acildi','geri_cekildi');
create type urgency as enum ('dusuk','orta','acil');
create type suggestion_status as enum ('yeni','degerlendiriliyor','planlandi','uygulandi','reddedildi');
create type media_kind as enum ('once','sonra','ek');

create table units (
  id bigint generated always as identity primary key,
  name text not null,
  slug text unique not null
);

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text, student_no text, department text,
  role user_role not null default 'student',
  unit_id bigint references units,        -- staff only
  language text default 'tr',
  created_at timestamptz default now()
);

create table buildings (
  id bigint generated always as identity primary key,
  name text not null, floors int,
  location extensions.geography(point, 4326) not null
);

create table places (                      -- QR codes are attached to places
  id bigint generated always as identity primary key,
  building_id bigint references buildings, floor int, name text,
  qr_code text unique not null,
  location extensions.geography(point, 4326)
);

create table reports (
  id bigint generated always as identity primary key,
  reporter_id uuid references profiles,
  is_anonymous boolean default false,
  title text not null, description text,
  category text, urgency urgency default 'orta', status report_status default 'alindi',
  unit_id bigint references units, building_id bigint references buildings,
  place_id bigint references places, floor int,
  location extensions.geography(point, 4326),
  ai_summary text, ai_confidence real, ai_materials text[],
  parent_report_id bigint references reports,
  vote_count int default 1, is_hidden boolean default false,
  created_at timestamptz default now(), resolved_at timestamptz
);
create index on reports using gist (location);
create index on reports (status, unit_id);
create index on reports (reporter_id);

create table report_media (
  id bigint generated always as identity primary key,
  report_id bigint references reports on delete cascade,
  kind media_kind not null, storage_path text not null,
  ai_verified boolean, ai_confidence real, created_at timestamptz default now()
);
create index on report_media (report_id);

create table report_events (               -- timeline
  id bigint generated always as identity primary key,
  report_id bigint references reports on delete cascade,
  type text not null, actor_id uuid, payload jsonb, created_at timestamptz default now()
);
create index on report_events (report_id);

create table report_votes (
  report_id bigint references reports on delete cascade,
  user_id uuid references profiles on delete cascade,
  primary key (report_id, user_id)
);

create table assignments (
  report_id bigint references reports on delete cascade,
  staff_id uuid references profiles,
  assigned_at timestamptz default now(), started_at timestamptz, completed_at timestamptz,
  route_order int, primary key (report_id, staff_id)
);

create table suggestions (
  id bigint generated always as identity primary key,
  author_id uuid references profiles, is_anonymous boolean default false,
  category text, title text not null, body text,
  status suggestion_status default 'yeni', vote_count int default 0,
  merged_into bigint references suggestions, is_hidden boolean default false,
  created_at timestamptz default now()
);
create table suggestion_votes (
  suggestion_id bigint references suggestions on delete cascade,
  user_id uuid references profiles on delete cascade,
  primary key (suggestion_id, user_id)
);
create table suggestion_replies (
  id bigint generated always as identity primary key,
  suggestion_id bigint references suggestions on delete cascade,
  admin_id uuid references profiles, body text not null,
  status_set suggestion_status, created_at timestamptz default now()
);

create table notifications (
  id bigint generated always as identity primary key,
  user_id uuid references profiles on delete cascade, type text, title text, body text,
  payload jsonb, read_at timestamptz, created_at timestamptz default now()
);
create index on notifications (user_id, created_at desc);
create table notification_prefs (
  user_id uuid primary key references profiles on delete cascade,
  channels jsonb, types jsonb, quiet_hours int4range
);

create table inventory (
  id bigint generated always as identity primary key,
  unit_id bigint references units, name text, qty int, min_qty int
);
create table material_requests (
  id bigint generated always as identity primary key,
  requester_id uuid references profiles, item_id bigint references inventory,
  qty int, status text default 'onay_bekliyor', created_at timestamptz default now()
);

create table security_reports (            -- anonymous security channel, separate table, no reporter column
  id bigint generated always as identity primary key,
  body text not null,
  location extensions.geography(point, 4326),
  status text default 'yeni', created_at timestamptz default now()
);

create table moderation_flags (
  id bigint generated always as identity primary key,
  target_type text, target_id bigint, reason text,
  source text check (source in ('ai','user')), status text default 'acik',
  created_at timestamptz default now()
);

create table ai_runs (                     -- log and cache
  id bigint generated always as identity primary key,
  kind text, model text, input_hash text, output jsonb, latency_ms int, created_at timestamptz default now()
);
create index on ai_runs (kind, input_hash);

create table allowed_emails (              -- accounts allowed outside the school domains (demo staff/admin)
  email text primary key
);

-- New auth users: only school domains or allow-listed e-mails; every user gets a profile row.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  domain text := lower(split_part(new.email, '@', 2));
begin
  if domain not in ('ogr.sakarya.edu.tr', 'sakarya.edu.tr')
     and not exists (select 1 from public.allowed_emails a where a.email = lower(new.email)) then
    raise exception 'Yalnızca okul e-postası ile kayıt olunabilir';
  end if;
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter publication supabase_realtime add table reports, report_events, notifications;
