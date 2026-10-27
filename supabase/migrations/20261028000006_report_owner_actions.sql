-- Students could update every column of their own report through the "reports update" policy (status, vote_count,
-- unit_id, is_hidden). Students now change reports only through security-definer functions; staff and admin keep
-- direct updates. Updates made inside security-definer functions (e.g. the vote counter) run as the owner and pass.

create function private.guard_student_report_update() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if current_user = 'authenticated' and private.auth_role() = 'student' then
    raise exception 'Öğrenciler bildirimi doğrudan güncelleyemez' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger reports_guard_student_update before update on public.reports
for each row execute function private.guard_student_report_update();

-- "Bildirimi geri çek": only the reporter, only while the report is still open.
create function public.withdraw_report(rid bigint) returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  changed int;
begin
  update public.reports set status = 'geri_cekildi'
  where id = rid and reporter_id = auth.uid() and status not in ('cozuldu', 'geri_cekildi');
  get diagnostics changed = row_count;
  if changed = 0 then
    return false;
  end if;
  insert into public.report_events (report_id, type, actor_id, payload)
  values (rid, 'geri_cekildi', auth.uid(), '{}'::jsonb);
  return true;
end;
$$;
revoke execute on function public.withdraw_report(bigint) from anon, public;
grant execute on function public.withdraw_report(bigint) to authenticated;
