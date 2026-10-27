-- Row level security (docs/PROJE_REHBERI.md section 8, plan Task 2 Step 4).

-- Helpers. Security definer so policies can read profiles/reports without recursive RLS checks.
create function public.auth_role() returns public.user_role
language sql stable security definer set search_path = ''
as $$ select role from public.profiles where id = auth.uid() $$;

create function public.auth_unit() returns bigint
language sql stable security definer set search_path = ''
as $$ select unit_id from public.profiles where id = auth.uid() $$;

create function public.can_read_report(rid bigint) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.reports r
    where r.id = rid
      and (
        r.reporter_id = auth.uid()
        or public.auth_role() = 'admin'
        or (public.auth_role() = 'staff' and r.unit_id = public.auth_unit())
        or not r.is_hidden
      )
  )
$$;

revoke execute on function public.auth_role(), public.auth_unit(), public.can_read_report(bigint) from anon, public;
grant execute on function public.auth_role(), public.auth_unit(), public.can_read_report(bigint) to authenticated;

alter table units enable row level security;
alter table profiles enable row level security;
alter table buildings enable row level security;
alter table places enable row level security;
alter table reports enable row level security;
alter table report_media enable row level security;
alter table report_events enable row level security;
alter table report_votes enable row level security;
alter table assignments enable row level security;
alter table suggestions enable row level security;
alter table suggestion_votes enable row level security;
alter table suggestion_replies enable row level security;
alter table notifications enable row level security;
alter table notification_prefs enable row level security;
alter table inventory enable row level security;
alter table material_requests enable row level security;
alter table security_reports enable row level security;
alter table moderation_flags enable row level security;  -- service key only
alter table ai_runs enable row level security;           -- service key only
alter table allowed_emails enable row level security;    -- service key only

-- Reference data: readable by everyone (QR links open before login).
create policy "reference read" on units for select to anon, authenticated using (true);
create policy "reference read" on buildings for select to anon, authenticated using (true);
create policy "reference read" on places for select to anon, authenticated using (true);

-- Profiles: own row; admin reads all. Role and unit can only be changed with the service key.
create policy "own profile read" on profiles for select to authenticated
  using (id = auth.uid() or public.auth_role() = 'admin');
create policy "own profile update" on profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
revoke update on profiles from authenticated;
grant update (full_name, student_no, department, language) on profiles to authenticated;

-- Reports: own, admin, or staff of the routed unit. Public listing goes through the public_reports view.
create policy "reports insert own" on reports for insert to authenticated
  with check (reporter_id = auth.uid());
create policy "reports read" on reports for select to authenticated
  using (
    reporter_id = auth.uid()
    or public.auth_role() = 'admin'
    or (public.auth_role() = 'staff' and unit_id = public.auth_unit())
  );
create policy "reports update" on reports for update to authenticated
  using (
    reporter_id = auth.uid()
    or public.auth_role() = 'admin'
    or (public.auth_role() = 'staff' and unit_id = public.auth_unit())
  );

-- Public, anonymity-preserving listing. Runs as the view owner on purpose: anonymous reporters stay hidden
-- while the raw table stays private. Only signed-in users can read it.
create view public.public_reports as
select
  id,
  case when is_anonymous then null else reporter_id end as reporter_id,
  is_anonymous, title, description, category, urgency, status, unit_id, building_id, place_id, floor,
  extensions.st_y(location::extensions.geometry) as lat,
  extensions.st_x(location::extensions.geometry) as lng,
  ai_summary, ai_confidence, ai_materials, parent_report_id, vote_count, created_at, resolved_at
from public.reports
where is_hidden = false and parent_report_id is null;
revoke all on public.public_reports from anon, public;
grant select on public.public_reports to authenticated;

create policy "media read" on report_media for select to authenticated using (public.can_read_report(report_id));
create policy "media insert" on report_media for insert to authenticated with check (public.can_read_report(report_id));

create policy "events read" on report_events for select to authenticated using (public.can_read_report(report_id));
create policy "events insert" on report_events for insert to authenticated
  with check (actor_id = auth.uid() and public.can_read_report(report_id));

create policy "votes read" on report_votes for select to authenticated using (true);
create policy "votes own insert" on report_votes for insert to authenticated with check (user_id = auth.uid());
create policy "votes own delete" on report_votes for delete to authenticated using (user_id = auth.uid());

create policy "assignments read" on assignments for select to authenticated
  using (staff_id = auth.uid() or public.auth_role() = 'admin');
create policy "assignments admin write" on assignments for all to authenticated
  using (public.auth_role() = 'admin') with check (public.auth_role() = 'admin');
create policy "assignments staff update" on assignments for update to authenticated
  using (staff_id = auth.uid()) with check (staff_id = auth.uid());

create policy "suggestions read" on suggestions for select to authenticated
  using (not is_hidden or author_id = auth.uid() or public.auth_role() = 'admin');
create policy "suggestions insert own" on suggestions for insert to authenticated with check (author_id = auth.uid());
create policy "suggestions admin update" on suggestions for update to authenticated using (public.auth_role() = 'admin');

create policy "suggestion votes read" on suggestion_votes for select to authenticated using (true);
create policy "suggestion votes own insert" on suggestion_votes for insert to authenticated with check (user_id = auth.uid());
create policy "suggestion votes own delete" on suggestion_votes for delete to authenticated using (user_id = auth.uid());

create policy "replies read" on suggestion_replies for select to authenticated using (true);
create policy "replies admin insert" on suggestion_replies for insert to authenticated
  with check (public.auth_role() = 'admin' and admin_id = auth.uid());

create policy "notifications own" on notifications for select to authenticated using (user_id = auth.uid());
create policy "notifications own update" on notifications for update to authenticated using (user_id = auth.uid());
create policy "prefs own" on notification_prefs for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "inventory read" on inventory for select to authenticated
  using (public.auth_role() = 'admin' or (public.auth_role() = 'staff' and unit_id = public.auth_unit()));
create policy "material requests read" on material_requests for select to authenticated
  using (requester_id = auth.uid() or public.auth_role() = 'admin');
create policy "material requests staff insert" on material_requests for insert to authenticated
  with check (requester_id = auth.uid() and public.auth_role() in ('staff', 'admin'));

-- Security channel: anyone signed in can write, only the security role can read.
create policy "security reports insert" on security_reports for insert to authenticated with check (true);
create policy "security reports read" on security_reports for select to authenticated
  using (public.auth_role() = 'security');

-- Storage: private bucket, uploads only into the user's own folder.
insert into storage.buckets (id, name, public) values ('report-media', 'report-media', false)
on conflict (id) do nothing;

create policy "report media upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'report-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "report media read" on storage.objects for select to authenticated
  using (bucket_id = 'report-media');
