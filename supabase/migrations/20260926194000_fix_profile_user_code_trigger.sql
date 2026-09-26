begin;

-- Keep the active Auth trigger and the profiles constraint on one role/code format.
create sequence if not exists public.student_login_code_seq as bigint minvalue 67000001 maxvalue 99999999 start with 67000001;
create sequence if not exists public.advisor_login_code_seq as bigint minvalue 1 maxvalue 999999 start with 1;
create sequence if not exists public.admin_login_code_seq as bigint minvalue 1 maxvalue 999999 start with 1;
create sequence if not exists public.coordinator_login_code_seq as bigint minvalue 1 maxvalue 999999 start with 1;

select setval('public.student_login_code_seq', coalesce((select max(user_code::bigint) from public.profiles where role = 'student' and user_code ~ '^[0-9]{8}$'), 67000001), exists (select 1 from public.profiles where role = 'student' and user_code ~ '^[0-9]{8}$'));
select setval('public.advisor_login_code_seq', coalesce((select max(substring(user_code from 4)::bigint) from public.profiles where role = 'advisor' and user_code ~ '^ADV[0-9]{4,6}$'), 1), exists (select 1 from public.profiles where role = 'advisor' and user_code ~ '^ADV[0-9]{4,6}$'));
select setval('public.admin_login_code_seq', coalesce((select max(substring(user_code from 4)::bigint) from public.profiles where role = 'admin' and user_code ~ '^ADM[0-9]{4,6}$'), 1), exists (select 1 from public.profiles where role = 'admin' and user_code ~ '^ADM[0-9]{4,6}$'));
select setval('public.coordinator_login_code_seq', coalesce((select max(substring(user_code from 4)::bigint) from public.profiles where role = 'coordinator' and user_code ~ '^COR[0-9]{4,6}$'), 1), exists (select 1 from public.profiles where role = 'coordinator' and user_code ~ '^COR[0-9]{4,6}$'));

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

alter table public.profiles drop constraint if exists profiles_user_code_role_format_check;
alter table public.profiles add constraint profiles_user_code_role_format_check check (
  (role = 'student' and user_code ~ '^[0-9]{8}$')
  or (role = 'advisor' and user_code ~ '^ADV[0-9]{4,6}$')
  or (role = 'admin' and user_code ~ '^ADM[0-9]{4,6}$')
  or (role = 'coordinator' and user_code ~ '^COR[0-9]{4,6}$')
) not valid;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text := lower(trim(coalesce(new.raw_app_meta_data ->> 'role', 'student')));
  assigned_user_code text;
begin
  if requested_role not in ('student', 'advisor', 'admin', 'coordinator') then
    requested_role := 'student';
  end if;

  assigned_user_code := private.next_profile_user_code(requested_role);

  insert into public.profiles (id, role, user_code, full_name, email)
  values (new.id, requested_role, assigned_user_code, new.raw_user_meta_data ->> 'full_name', new.email)
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function private.next_profile_user_code(text) from public, anon, authenticated;
grant execute on function private.next_profile_user_code(text) to service_role;
revoke all on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to service_role;

commit;
