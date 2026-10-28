-- Lets a student delete their own account (KVKK right to erasure).
-- Reports and suggestions stay, detached from the person; votes,
-- notifications and preferences go with the profile via cascade.
-- Staff and admin accounts own assignment history, so the
-- administration closes those instead.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Oturum bulunamadı' using errcode = '42501';
  end if;
  if private.auth_role() <> 'student' then
    raise exception 'Personel ve yönetici hesapları yönetim tarafından kapatılır' using errcode = '42501';
  end if;

  update public.reports set reporter_id = null where reporter_id = uid;
  update public.suggestions set author_id = null where author_id = uid;
  update public.material_requests set requester_id = null where requester_id = uid;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
