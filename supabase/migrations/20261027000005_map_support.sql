-- Campus map support: building coordinates as plain numbers, a cover photo on the public listing,
-- and "Ben de yaşıyorum" votes kept in reports.vote_count.

create view public.building_points with (security_invoker = true) as
select id, name, floors,
  extensions.st_y(location::extensions.geometry) as lat,
  extensions.st_x(location::extensions.geometry) as lng
from public.buildings;
grant select on public.building_points to anon, authenticated;

-- Same columns as before plus the first "before" photo. Photos are EXIF-stripped on upload and the map shows them
-- to every signed-in user, as in the design; report_media itself stays private.
create or replace view public.public_reports as
select
  r.id,
  case when r.is_anonymous then null else r.reporter_id end as reporter_id,
  r.is_anonymous, r.title, r.description, r.category, r.urgency, r.status, r.unit_id, r.building_id, r.place_id, r.floor,
  extensions.st_y(r.location::extensions.geometry) as lat,
  extensions.st_x(r.location::extensions.geometry) as lng,
  r.ai_summary, r.ai_confidence, r.ai_materials, r.parent_report_id, r.vote_count, r.created_at, r.resolved_at,
  (select m.storage_path from public.report_media m
   where m.report_id = r.id and m.kind = 'once' order by m.id limit 1) as cover_path
from public.reports r
where r.is_hidden = false and r.parent_report_id is null;
revoke all on public.public_reports from anon, public;
grant select on public.public_reports to authenticated;

create function private.sync_vote_count() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.reports set vote_count = vote_count + 1 where id = new.report_id;
  else
    update public.reports set vote_count = greatest(vote_count - 1, 0) where id = old.report_id;
  end if;
  return null;
end;
$$;
revoke execute on function private.sync_vote_count() from anon, authenticated, public;

create trigger report_votes_count after insert or delete on public.report_votes
for each row execute function private.sync_vote_count();
