begin;

-- A profile has one public-facing login code. UUIDs remain the internal keys
-- shared with auth.users, while advisor assignments live on internship records.
create or replace function private.next_profile_user_code(requested_role text)
returns text
language plpgsql
set search_path = ''
as $$
declare
  normalized_role text := lower(trim(requested_role));
  sequence_value bigint;
begin
  case normalized_role
    when 'student' then
      sequence_value := nextval('public.student_login_code_seq');
      return lpad(sequence_value::text, 8, '0');
    when 'advisor' then
      sequence_value := nextval('public.advisor_login_code_seq');
      return 'ADV' || lpad(sequence_value::text, 4, '0');
    when 'admin' then
      sequence_value := nextval('public.admin_login_code_seq');
      return 'ADM' || lpad(sequence_value::text, 4, '0');
    when 'coordinator' then
      sequence_value := nextval('public.coordinator_login_code_seq');
      return 'COR' || lpad(sequence_value::text, 4, '0');
    else
      raise exception 'Unsupported profile role: %', requested_role;
  end case;
end;
$$;

revoke all on function private.next_profile_user_code(text) from public, anon, authenticated;
grant execute on function private.next_profile_user_code(text) to service_role;

do $$
begin
  if exists (
    select 1
    from public.profiles
    where username is not null
      and student_code is not null
      and upper(btrim(username)) <> upper(btrim(student_code))
  ) then
    raise exception 'Cannot consolidate profile codes because username and student_code disagree';
  end if;
end;
$$;

alter table public.profiles rename column username to user_code;

update public.profiles
set user_code = upper(btrim(coalesce(user_code, student_code)))
where user_code is not null or student_code is not null;

do $$
declare
  profile_row record;
begin
  for profile_row in
    select id, role
    from public.profiles
    where user_code is null
    order by created_at, id
  loop
    update public.profiles
    set user_code = private.next_profile_user_code(profile_row.role)
    where id = profile_row.id;
  end loop;
end;
$$;

-- Preserve any assignment that exists only on the legacy profile column.
update public.internship_records as internship
set advisor_id = profile.advisor_id
from public.profiles as profile
where internship.student_id = profile.id
  and internship.advisor_id is null
  and profile.advisor_id is not null;

alter table public.profiles
  drop constraint if exists profiles_username_role_format_check;

drop index if exists public.profiles_username_idx;
drop index if exists public.profiles_student_code_idx;
drop index if exists public.profiles_advisor_id_idx;

alter table public.profiles
  drop constraint if exists profiles_advisor_id_fkey,
  drop column student_code,
  drop column advisor_id,
  alter column user_code set not null;

alter table public.profiles
  add constraint profiles_user_code_key unique (user_code),
  add constraint profiles_user_code_role_format_check check (
    (role = 'student' and user_code ~ '^[0-9]{8}$')
    or (role = 'advisor' and user_code ~ '^ADV[0-9]{4,6}$')
    or (role = 'admin' and user_code ~ '^ADM[0-9]{4,6}$')
    or (role = 'coordinator' and user_code ~ '^COR[0-9]{4,6}$')
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text := lower(coalesce(new.raw_app_meta_data ->> 'role', 'student'));
  assigned_user_code text;
begin
  if requested_role not in ('student', 'advisor', 'admin', 'coordinator') then
    requested_role := 'student';
  end if;

  assigned_user_code := private.next_profile_user_code(requested_role);

  insert into public.profiles (
    id,
    role,
    user_code,
    full_name,
    email
  )
  values (
    new.id,
    requested_role,
    assigned_user_code,
    new.raw_user_meta_data ->> 'full_name',
    new.email
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to service_role;

create or replace function private.guard_profile_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') or private.current_role() = 'admin' then
    return new;
  end if;

  if old.id <> (select auth.uid())
     or new.id is distinct from old.id
     or new.role is distinct from old.role
     or new.user_code is distinct from old.user_code
     or new.email is distinct from old.email
     or new.created_at is distinct from old.created_at then
    raise exception 'You cannot change protected profile fields';
  end if;
  return new;
end;
$$;

drop function if exists public.next_profile_username(text);

commit;
