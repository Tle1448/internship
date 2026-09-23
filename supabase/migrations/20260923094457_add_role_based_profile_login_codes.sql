create sequence if not exists public.student_login_code_seq
  as bigint
  minvalue 67000001
  maxvalue 99999999
  start with 67000001;

create sequence if not exists public.advisor_login_code_seq
  as bigint
  minvalue 1
  maxvalue 999999
  start with 1;

create sequence if not exists public.admin_login_code_seq
  as bigint
  minvalue 1
  maxvalue 999999
  start with 1;

create sequence if not exists public.coordinator_login_code_seq
  as bigint
  minvalue 1
  maxvalue 999999
  start with 1;

with linked_profiles as (
  select
    p.id,
    p.role,
    row_number() over (
      partition by p.role
      order by p.created_at, p.id
    ) as role_number
  from public.profiles p
  inner join auth.users u on u.id = p.id
),
generated_codes as (
  select
    id,
    role,
    case role
      when 'student' then (67000000 + role_number)::text
      when 'advisor' then 'ADV' || lpad(role_number::text, 4, '0')
      when 'admin' then 'ADM' || lpad(role_number::text, 4, '0')
      when 'coordinator' then 'COR' || lpad(role_number::text, 4, '0')
    end as username
  from linked_profiles
)
update public.profiles p
set
  username = generated_codes.username,
  student_code = case
    when generated_codes.role = 'student' then generated_codes.username
    else p.student_code
  end,
  updated_at = now()
from generated_codes
where p.id = generated_codes.id;

update public.profiles p
set username = null, updated_at = now()
where not exists (
  select 1
  from auth.users u
  where u.id = p.id
);

select setval(
  'public.student_login_code_seq',
  coalesce((
    select max(username::bigint)
    from public.profiles
    where role = 'student' and username ~ '^[0-9]{8}$'
  ), 67000001),
  exists (
    select 1
    from public.profiles
    where role = 'student' and username ~ '^[0-9]{8}$'
  )
);

select setval(
  'public.advisor_login_code_seq',
  coalesce((
    select max(substring(username from 4)::bigint)
    from public.profiles
    where role = 'advisor' and username ~ '^ADV[0-9]{4,6}$'
  ), 1),
  exists (
    select 1
    from public.profiles
    where role = 'advisor' and username ~ '^ADV[0-9]{4,6}$'
  )
);

select setval(
  'public.admin_login_code_seq',
  coalesce((
    select max(substring(username from 4)::bigint)
    from public.profiles
    where role = 'admin' and username ~ '^ADM[0-9]{4,6}$'
  ), 1),
  exists (
    select 1
    from public.profiles
    where role = 'admin' and username ~ '^ADM[0-9]{4,6}$'
  )
);

select setval(
  'public.coordinator_login_code_seq',
  coalesce((
    select max(substring(username from 4)::bigint)
    from public.profiles
    where role = 'coordinator' and username ~ '^COR[0-9]{4,6}$'
  ), 1),
  exists (
    select 1
    from public.profiles
    where role = 'coordinator' and username ~ '^COR[0-9]{4,6}$'
  )
);

alter table public.profiles
  drop constraint if exists profiles_username_role_format_check;

alter table public.profiles
  add constraint profiles_username_role_format_check
  check (
    username is null
    or (
      role is not null
      and (
        (
          role = 'student'
          and username ~ '^[0-9]{8}$'
          and student_code is not null
          and student_code = username
        )
        or (role = 'advisor' and username ~ '^ADV[0-9]{4,6}$')
        or (role = 'admin' and username ~ '^ADM[0-9]{4,6}$')
        or (role = 'coordinator' and username ~ '^COR[0-9]{4,6}$')
      )
    )
  );

create or replace function public.next_profile_username(requested_role text)
returns text
language plpgsql
security invoker
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
      raise exception 'Unsupported profile role';
  end case;
end;
$$;

revoke all on sequence
  public.student_login_code_seq,
  public.advisor_login_code_seq,
  public.admin_login_code_seq,
  public.coordinator_login_code_seq
from public, anon, authenticated;

grant usage, select on sequence
  public.student_login_code_seq,
  public.advisor_login_code_seq,
  public.admin_login_code_seq,
  public.coordinator_login_code_seq
to service_role;

revoke all on function public.next_profile_username(text)
from public, anon, authenticated;

grant execute on function public.next_profile_username(text)
to service_role;

comment on function public.next_profile_username(text)
is 'Generates the next role-based login code. Server-side service role only.';
