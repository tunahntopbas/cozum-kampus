-- PHASE 2: apply ONLY after additive 000012 RPCs, new AI service and new web are deployed
-- and the trusted submit + MyReports extra-photo + staff solution-photo flows have passed smoke tests.
-- Old clients fail closed after this migration; they must reload the new bundle. No remote apply here.

revoke insert on public.reports from anon, authenticated;
drop policy "reports insert own" on public.reports;
revoke insert, update, delete on public.report_media from anon, authenticated;
drop policy "media insert" on public.report_media;

-- Staff can still update workflow fields, but no browser role can change moderated content,
-- identity, anonymity or visibility after approval. Service-role writes are the only publication authority.
create function private.guard_moderated_report_content() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') and
    row(new.reporter_id, new.title, new.description, new.category, new.is_anonymous,
        new.is_hidden, new.ai_summary, new.ai_confidence, new.ai_materials, new.parent_report_id)
    is distinct from
    row(old.reporter_id, old.title, old.description, old.category, old.is_anonymous,
        old.is_hidden, old.ai_summary, old.ai_confidence, old.ai_materials, old.parent_report_id)
  then
    raise exception 'İçerik yalnızca denetlenen sunucu akışından değiştirilebilir' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger reports_guard_moderated_content before update on public.reports
for each row execute function private.guard_moderated_report_content();

