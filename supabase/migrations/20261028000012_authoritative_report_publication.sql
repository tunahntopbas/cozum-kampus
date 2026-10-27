-- Publication is an authenticated AI-service operation, not a browser-supplied moderation claim.
-- Generated with `supabase migration new`; ordered after 000011 (the local CLI clock predates it).
-- Deploy the AI and web changes together with this migration. Do not apply independently to old clients.

-- PHASE 1 (additive): deploy this, then API + web. Old browser inserts remain possible until
-- PHASE 2 enforcement is applied. Do not treat phase 1 alone as closing direct-REST bypasses.

-- Unattached/unreviewed uploads are private to the uploader. Published/authorized report media
-- remains readable, including for staff and the report owner. No UPDATE policy exists on Storage,
-- so a caller cannot replace the bytes behind a path after the server has analysed it.
drop policy "report media read" on storage.objects;
create policy "report media read" on storage.objects for select to authenticated
using (bucket_id = 'report-media' and (
  (storage.foldername(name))[1] = auth.uid()::text
  or exists (
    select 1 from public.report_media m
    where m.storage_path = name and private.can_read_report(m.report_id)
  )
));

-- Approved bytes are server-owned copies, not paths in an uploader-controlled folder.
-- Restrictive policies also defend against other permissive policies now or added later.
create policy "approved media insert server only" on storage.objects as restrictive
for insert to anon, authenticated
with check (bucket_id <> 'report-media' or name not like 'moderated/%');
create policy "approved media update server only" on storage.objects as restrictive
for update to anon, authenticated
using (bucket_id <> 'report-media' or name not like 'moderated/%')
with check (bucket_id <> 'report-media' or name not like 'moderated/%');
create policy "approved media delete server only" on storage.objects as restrictive
for delete to anon, authenticated
using (bucket_id <> 'report-media' or name not like 'moderated/%');

-- Both RPCs are invoker functions: EXECUTE is service_role-only and there is no SECURITY DEFINER
-- elevation. One PostgREST RPC transaction inserts the report + all media + timeline, or none of them.
create function public.publish_moderated_report(p_report jsonb, p_image_paths text[])
returns bigint language plpgsql security invoker set search_path = ''
as $$
declare
  rid bigint;
  uid uuid := (p_report ->> 'reporter_id')::uuid;
  routed_unit bigint;
  image_path text;
begin
  if current_user <> 'service_role' then
    raise exception 'Sunucu yetkisi gerekli' using errcode = '42501';
  end if;
  if uid is null or not exists (select 1 from public.profiles where id = uid) then
    raise exception 'Geçersiz bildiren' using errcode = '22023';
  end if;
  if cardinality(p_image_paths) > 3 or
     (coalesce(btrim(p_report ->> 'description'), '') = '' and coalesce(cardinality(p_image_paths), 0) = 0)
  then
    raise exception 'Geçersiz bildirim içeriği' using errcode = '22023';
  end if;
  if p_report ->> 'place_id' is not null and not exists (
    select 1 from public.places where id = (p_report ->> 'place_id')::bigint
      and building_id = (p_report ->> 'building_id')::bigint
  ) then
    raise exception 'Konum ve bina uyuşmuyor' using errcode = '22023';
  end if;
  select id into routed_unit from public.units where slug = p_report ->> 'unit_slug';
  if routed_unit is null then
    raise exception 'Birim bulunamadı' using errcode = '22023';
  end if;
  foreach image_path in array coalesce(p_image_paths, array[]::text[]) loop
    if image_path !~ '^moderated/[0-9a-f-]{36}\.jpg$' or not exists (
      select 1 from storage.objects where bucket_id = 'report-media' and name = image_path
    ) then
      raise exception 'Fotoğraf sahipliği doğrulanamadı' using errcode = '42501';
    end if;
  end loop;

  insert into public.reports (
    reporter_id, is_anonymous, is_hidden, title, description, category, urgency, status, unit_id,
    building_id, place_id, floor, location, ai_summary, ai_confidence, ai_materials
  ) values (
    uid, (p_report ->> 'is_anonymous')::boolean, false, p_report ->> 'title', p_report ->> 'description',
    p_report ->> 'category', (p_report ->> 'urgency')::public.urgency, 'yonlendirildi', routed_unit,
    (p_report ->> 'building_id')::bigint, (p_report ->> 'place_id')::bigint, (p_report ->> 'floor')::int,
    (p_report ->> 'location')::extensions.geography, p_report ->> 'ai_summary',
    (p_report ->> 'ai_confidence')::real,
    array(select jsonb_array_elements_text(p_report -> 'ai_materials'))
  ) returning id into rid;

  insert into public.report_media (report_id, kind, storage_path)
    select rid, 'once', path from unnest(coalesce(p_image_paths, array[]::text[])) as path;
  insert into public.report_events (report_id, type, actor_id, payload)
    values (rid, 'olusturuldu', uid,
      jsonb_build_object('category', p_report ->> 'category', 'urgency', p_report ->> 'urgency', 'ai_pending', false));
  return rid;
end;
$$;
revoke all on function public.publish_moderated_report(jsonb, text[]) from public, anon, authenticated;
grant execute on function public.publish_moderated_report(jsonb, text[]) to service_role;

create function public.attach_moderated_report_media(
  p_report_id bigint, p_actor_id uuid, p_image_path text, p_kind public.media_kind
) returns bigint language plpgsql security invoker set search_path = ''
as $$
declare
  cur public.reports%rowtype;
  actor public.profiles%rowtype;
  mid bigint;
begin
  if current_user <> 'service_role' then
    raise exception 'Sunucu yetkisi gerekli' using errcode = '42501';
  end if;
  select * into cur from public.reports where id = p_report_id for update;
  if not found then
    raise exception 'Bildirim bulunamadı' using errcode = '22023';
  end if;
  select * into actor from public.profiles where id = p_actor_id;
  if not found or p_kind is null or not (
    coalesce((p_kind = 'ek' and cur.reporter_id = p_actor_id)
    or (p_kind = 'sonra' and (actor.role = 'admin' or
      (actor.role = 'staff' and actor.unit_id is not null and actor.unit_id = cur.unit_id))), false)
  ) then
    raise exception 'Fotoğraf ekleme yetkisi yok' using errcode = '42501';
  end if;
  if p_image_path is null or p_image_path !~ '^moderated/[0-9a-f-]{36}\.jpg$' or
     not exists (select 1 from storage.objects where bucket_id = 'report-media' and name = p_image_path)
  then
    raise exception 'Fotoğraf sahipliği doğrulanamadı' using errcode = '42501';
  end if;
  insert into public.report_media (report_id, kind, storage_path)
    values (p_report_id, p_kind, p_image_path) returning id into mid;
  if p_kind = 'ek' then
    insert into public.report_events (report_id, type, actor_id, payload)
      values (p_report_id, 'ek_fotograf', p_actor_id, '{}'::jsonb);
  end if;
  return mid;
end;
$$;
revoke all on function public.attach_moderated_report_media(bigint, uuid, text, public.media_kind)
  from public, anon, authenticated;
grant execute on function public.attach_moderated_report_media(bigint, uuid, text, public.media_kind) to service_role;
