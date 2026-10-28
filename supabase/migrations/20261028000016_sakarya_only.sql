-- Only @sakarya.edu.tr addresses may sign up; allowed_emails stays as the explicit exception list.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if lower(split_part(new.email, '@', 2)) <> 'sakarya.edu.tr'
     and not exists (select 1 from public.allowed_emails a where a.email = lower(new.email)) then
    raise exception 'Yalnızca @sakarya.edu.tr adresiyle kayıt olunabilir';
  end if;
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;
