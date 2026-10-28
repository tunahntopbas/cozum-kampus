-- Profanity filter enforced in the database, so a direct API call cannot bypass the browser check.
-- Keep the word lists in step with apps/web/lib/profanity.ts.

create function private.has_profanity(input text) returns boolean
language plpgsql immutable set search_path = ''
as $$
declare
  w text;
  roots text[] := array['orospu','amcık','amcik','amına','amina','yarrak','yarak','siktir','sikik','sikiş','sikis',
    'sikerim','sikeyim','sikim','sikti','pezevenk','kahpe','kaltak','piç','ibne','şerefsiz','serefsiz','gavat',
    'puşt','pust','yavşak','yavsak','gerizekalı','gerizekali','dangalak','salak','aptal','ananı','anani',
    'götveren','gotveren'];
  words text[] := array['amk','aq','oç','oc','mk','göt','got','sik','sg','piç','pic','ibne'];
  r text;
begin
  if input is null then
    return false;
  end if;
  -- Turkish dotted capitals first, then digit/symbol look-alikes.
  input := translate(lower(replace(replace(input, 'I', 'ı'), 'İ', 'i')), '013457@$', 'oieastas');
  foreach w in array regexp_split_to_array(input, '[^[:alpha:]]+') loop
    continue when w = '';
    foreach r in array array[w, regexp_replace(w, '(.)\1+', '\1', 'g')] loop
      if r = any(words) then
        return true;
      end if;
      if exists (select 1 from unnest(roots) root where left(r, length(root)) = root) then
        return true;
      end if;
    end loop;
  end loop;
  return false;
end;
$$;

create function private.reject_profanity() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if private.has_profanity(coalesce(new.title, '') || ' ' || coalesce(new.description, '')) then
    raise exception 'Metinde uygunsuz bir ifade var.' using errcode = '22023';
  end if;
  return new;
end;
$$;

create function private.reject_suggestion_profanity() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if private.has_profanity(coalesce(new.title, '') || ' ' || coalesce(new.body, '')) then
    raise exception 'Metinde uygunsuz bir ifade var.' using errcode = '22023';
  end if;
  return new;
end;
$$;

create trigger reports_reject_profanity before insert or update of title, description on public.reports
  for each row execute function private.reject_profanity();
create trigger suggestions_reject_profanity before insert or update of title, body on public.suggestions
  for each row execute function private.reject_suggestion_profanity();
