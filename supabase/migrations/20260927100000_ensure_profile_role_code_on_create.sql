begin;

-- Auth may expose custom metadata at different points in the user-creation
-- lifecycle. Read the trusted app metadata first, then the matching fallback
-- written by the admin API, so the generated code always matches the profile role.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text := lower(trim(coalesce(
    nullif(new.raw_app_meta_data ->> 'role', ''),
    nullif(new.raw_user_meta_data ->> 'role', ''),
    'student'
  )));
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

revoke all on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to service_role;

commit;
