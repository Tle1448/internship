begin;

-- Keep privileged authorization helpers out of the exposed public schema.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create or replace function private.current_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles p
  where p.id = (select auth.uid())
  limit 1
$$;

create or replace function private.advises_student(target_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.internship_records ir
    where ir.student_id = target_student_id
      and ir.advisor_id = (select auth.uid())
  )
$$;

revoke all on function private.current_role() from public, anon;
revoke all on function private.advises_student(uuid) from public, anon;
grant execute on function private.current_role() to authenticated, service_role;
grant execute on function private.advises_student(uuid) to authenticated, service_role;

create or replace function public.current_role()
returns text
language sql
stable
security invoker
set search_path = ''
as $$ select private.current_role() $$;

create or replace function public.advises_student(student_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$ select private.advises_student(student_id) $$;

revoke all on function public.current_role() from public, anon;
revoke all on function public.advises_student(uuid) from public, anon;
grant execute on function public.current_role() to authenticated, service_role;
grant execute on function public.advises_student(uuid) to authenticated, service_role;

revoke all on function public.is_admin() from public, anon;
revoke all on function public.is_student() from public, anon;
revoke all on function public.is_advisor() from public, anon;
revoke all on function public.is_coordinator() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;
grant execute on function public.is_student() to authenticated, service_role;
grant execute on function public.is_advisor() to authenticated, service_role;
grant execute on function public.is_coordinator() to authenticated, service_role;

-- New Auth users receive a server-generated login code. Authorization role is
-- accepted only from app_metadata, which cannot be edited by the end user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text := lower(coalesce(new.raw_app_meta_data ->> 'role', 'student'));
  assigned_username text;
begin
  if requested_role not in ('student', 'advisor', 'admin', 'coordinator') then
    requested_role := 'student';
  end if;

  assigned_username := public.next_profile_username(requested_role);

  insert into public.profiles (
    id,
    role,
    username,
    student_code,
    full_name,
    email
  )
  values (
    new.id,
    requested_role,
    assigned_username,
    case when requested_role = 'student' then assigned_username end,
    new.raw_user_meta_data ->> 'full_name',
    new.email
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to service_role;

-- Relational and value integrity. NOT VALID preserves historical test data but
-- still protects every new or changed row.
create index if not exists profiles_advisor_id_idx
  on public.profiles (advisor_id);

create unique index if not exists job_applications_one_pending_job_idx
  on public.job_applications (student_id, job_id)
  where job_id is not null and status = 'pending';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_gpa_range_check') then
    alter table public.profiles
      add constraint profiles_gpa_range_check check (gpa is null or gpa between 0 and 4) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_year_range_check') then
    alter table public.profiles
      add constraint profiles_year_range_check check (year is null or year between 1 and 8) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_credits_nonnegative_check') then
    alter table public.profiles
      add constraint profiles_credits_nonnegative_check check (credits is null or credits >= 0) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'internship_progress_range_check') then
    alter table public.internship_records
      add constraint internship_progress_range_check check (progress_percent is null or progress_percent between 0 and 100) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'internship_date_order_check') then
    alter table public.internship_records
      add constraint internship_date_order_check check (started_at is null or ended_at is null or started_at <= ended_at) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'jobs_date_order_check') then
    alter table public.jobs
      add constraint jobs_date_order_check check (start_date is null or end_date is null or start_date <= end_date) not valid;
  end if;
end
$$;

update public.internship_records
set status = 'in_progress'
where status is null or btrim(status) = '';

update public.job_applications
set reviewed_at = coalesce(reviewed_at, updated_at, created_at)
where status in ('approved', 'rejected') and reviewed_at is null;

update public.external_company_submissions
set reviewed_at = coalesce(reviewed_at, updated_at, created_at)
where status in ('approved', 'rejected') and reviewed_at is null;

update public.applications
set decided_at = coalesce(decided_at, created_at)
where status in ('approved', 'rejected') and decided_at is null;

create or replace function private.assert_record_student_match()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.internship_records ir
    where ir.id = new.record_id and ir.student_id = new.student_id
  ) then
    raise exception 'record_id does not belong to student_id';
  end if;
  return new;
end;
$$;

drop trigger if exists progress_updates_record_student_guard on public.progress_updates;
create trigger progress_updates_record_student_guard
before insert or update on public.progress_updates
for each row execute function private.assert_record_student_match();

drop trigger if exists weekly_logs_record_student_guard on public.weekly_logs;
create trigger weekly_logs_record_student_guard
before insert or update on public.weekly_logs
for each row execute function private.assert_record_student_match();

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
     or new.username is distinct from old.username
     or new.student_code is distinct from old.student_code
     or new.advisor_id is distinct from old.advisor_id
     or new.email is distinct from old.email
     or new.created_at is distinct from old.created_at then
    raise exception 'You cannot change protected profile fields';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_update on public.profiles;
create trigger profiles_guard_update
before update on public.profiles
for each row execute function private.guard_profile_update();

create or replace function private.guard_job_application_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare actor_role text := private.current_role();
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') then return new; end if;

  if actor_role in ('admin', 'coordinator') then
    if new.status is distinct from old.status and new.status in ('approved', 'rejected') then
      new.reviewed_by := (select auth.uid());
      new.reviewed_at := now();
    end if;
    return new;
  end if;

  if actor_role = 'student'
     and old.student_id = (select auth.uid())
     and new.student_id is not distinct from old.student_id
     and new.job_id is not distinct from old.job_id
     and new.job_title is not distinct from old.job_title
     and new.company_name is not distinct from old.company_name
     and new.reason is not distinct from old.reason
     and new.reviewed_by is not distinct from old.reviewed_by
     and new.reviewed_at is not distinct from old.reviewed_at
     and new.submitted_at is not distinct from old.submitted_at
     and new.created_at is not distinct from old.created_at
     and (new.status is not distinct from old.status or (old.status = 'pending' and new.status = 'cancelled')) then
    return new;
  end if;

  raise exception 'You cannot review or reassign this application';
end;
$$;

drop trigger if exists job_applications_guard_update on public.job_applications;
create trigger job_applications_guard_update
before update on public.job_applications
for each row execute function private.guard_job_application_update();

create or replace function private.guard_external_submission_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare actor_role text := private.current_role();
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') then return new; end if;
  if actor_role in ('admin', 'coordinator') then
    if new.status is distinct from old.status and new.status in ('approved', 'rejected') then
      new.reviewed_by := (select auth.uid());
      new.reviewed_at := now();
    end if;
    return new;
  end if;
  if actor_role = 'student'
     and old.student_id = (select auth.uid())
     and old.status = 'pending'
     and new.student_id is not distinct from old.student_id
     and new.status is not distinct from old.status
     and new.reviewed_by is not distinct from old.reviewed_by
     and new.reviewed_at is not distinct from old.reviewed_at
     and new.created_at is not distinct from old.created_at then
    return new;
  end if;
  raise exception 'You cannot review or reassign this submission';
end;
$$;

drop trigger if exists external_submissions_guard_update on public.external_company_submissions;
create trigger external_submissions_guard_update
before update on public.external_company_submissions
for each row execute function private.guard_external_submission_update();

create or replace function private.guard_legacy_application_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare actor_role text := private.current_role();
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') then return new; end if;
  if actor_role in ('admin', 'coordinator') then
    if new.status is distinct from old.status and new.status in ('approved', 'rejected') then
      new.decided_at := now();
    end if;
    return new;
  end if;
  if actor_role = 'student'
     and old.student_id = (select auth.uid())
     and old.status = 'pending'
     and new.student_id is not distinct from old.student_id
     and new.status is not distinct from old.status
     and new.decided_at is not distinct from old.decided_at
     and new.created_at is not distinct from old.created_at then
    return new;
  end if;
  raise exception 'You cannot review or reassign this legacy application';
end;
$$;

drop trigger if exists applications_guard_update on public.applications;
create trigger applications_guard_update
before update on public.applications
for each row execute function private.guard_legacy_application_update();

create or replace function private.guard_internship_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare actor_role text := private.current_role();
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') or actor_role in ('admin', 'coordinator') then
    return new;
  end if;
  if actor_role = 'student'
     and old.student_id = (select auth.uid())
     and new.id is not distinct from old.id
     and new.student_id is not distinct from old.student_id
     and new.advisor_id is not distinct from old.advisor_id
     and new.company_id is not distinct from old.company_id
     and new.job_application_id is not distinct from old.job_application_id
     and new.status is not distinct from old.status
     and new.placement_status is not distinct from old.placement_status
     and new.progress_health is not distinct from old.progress_health
     and new.supervision_status is not distinct from old.supervision_status
     and new.evaluation_status is not distinct from old.evaluation_status
     and new.created_at is not distinct from old.created_at then
    return new;
  end if;
  raise exception 'You cannot change protected internship fields';
end;
$$;

drop trigger if exists internship_records_guard_update on public.internship_records;
create trigger internship_records_guard_update
before update on public.internship_records
for each row execute function private.guard_internship_update();

create or replace function private.guard_weekly_log_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare actor_role text := private.current_role();
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') or actor_role = 'admin' then return new; end if;

  if actor_role = 'student'
     and old.student_id = (select auth.uid())
     and new.record_id is not distinct from old.record_id
     and new.student_id is not distinct from old.student_id
     and new.week is not distinct from old.week
     and new.advisor_comment is not distinct from old.advisor_comment
     and new.created_at is not distinct from old.created_at
     and new.status in ('pending', 'revision') then
    if new.status = 'pending' and new.submitted_at is null then new.submitted_at := now(); end if;
    return new;
  end if;

  if actor_role = 'advisor'
     and private.advises_student(old.student_id)
     and new.record_id is not distinct from old.record_id
     and new.student_id is not distinct from old.student_id
     and new.week is not distinct from old.week
     and new.title is not distinct from old.title
     and new.content is not distinct from old.content
     and new.submitted_at is not distinct from old.submitted_at
     and new.created_at is not distinct from old.created_at
     and new.status in ('pending', 'approved', 'revision') then
    return new;
  end if;

  raise exception 'You cannot change protected weekly log fields';
end;
$$;

drop trigger if exists weekly_logs_guard_update on public.weekly_logs;
create trigger weekly_logs_guard_update
before update on public.weekly_logs
for each row execute function private.guard_weekly_log_update();

create or replace function private.guard_progress_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') or private.current_role() = 'admin' then return new; end if;
  if private.current_role() = 'student'
     and old.student_id = (select auth.uid())
     and new.record_id is not distinct from old.record_id
     and new.student_id is not distinct from old.student_id
     and new.created_at is not distinct from old.created_at then
    return new;
  end if;
  raise exception 'You cannot reassign this progress update';
end;
$$;

drop trigger if exists progress_updates_guard_update on public.progress_updates;
create trigger progress_updates_guard_update
before update on public.progress_updates
for each row execute function private.guard_progress_update();

create or replace function private.guard_notification_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') or private.current_role() = 'admin' then return new; end if;
  if new.id is distinct from old.id
     or new.recipient_type is distinct from old.recipient_type
     or new.recipient_id is distinct from old.recipient_id
     or new.title is distinct from old.title
     or new.message is distinct from old.message
     or new.application_id is distinct from old.application_id
     or new.created_at is distinct from old.created_at then
    raise exception 'Only is_read can be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists notifications_guard_update on public.notifications;
create trigger notifications_guard_update
before update on public.notifications
for each row execute function private.guard_notification_update();

create or replace function private.guard_student_document_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare actor_role text := private.current_role();
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') or actor_role in ('admin', 'coordinator') then
    if new.status is distinct from old.status then
      new.reviewed_by := (select auth.uid());
      new.reviewed_at := now();
    end if;
    return new;
  end if;
  if actor_role = 'student'
     and old.student_id = (select auth.uid())
     and old.status in ('pending', 'needs_edit')
     and new.student_id is not distinct from old.student_id
     and new.status is not distinct from old.status
     and new.comment is not distinct from old.comment
     and new.reviewed_by is not distinct from old.reviewed_by
     and new.reviewed_at is not distinct from old.reviewed_at
     and new.submitted_at is not distinct from old.submitted_at then
    return new;
  end if;
  raise exception 'You cannot review or reassign this document';
end;
$$;

drop trigger if exists student_documents_guard_update on public.student_documents;
create trigger student_documents_guard_update
before update on public.student_documents
for each row execute function private.guard_student_document_update();

-- Coordinators may read role-wide broadcasts. Triggers ensure recipients can
-- change only the read flag.
drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications
for select to authenticated
using (
  recipient_id = (select auth.uid())
  or (recipient_id is null and recipient_type = private.current_role())
  or (select public.is_admin())
);

drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications
for update to authenticated
using (
  recipient_id = (select auth.uid())
  or (recipient_id is null and recipient_type = private.current_role())
  or (select public.is_admin())
)
with check (
  recipient_id = (select auth.uid())
  or (recipient_id is null and recipient_type = private.current_role())
  or (select public.is_admin())
);

drop policy if exists progress_insert on public.progress_updates;
create policy progress_insert on public.progress_updates
for insert to authenticated
with check (
  student_id = (select auth.uid())
  and exists (
    select 1 from public.internship_records ir
    where ir.id = record_id and ir.student_id = (select auth.uid())
  )
);

drop policy if exists weekly_insert on public.weekly_logs;
create policy weekly_insert on public.weekly_logs
for insert to authenticated
with check (
  (
    student_id = (select auth.uid())
    and status = 'pending'
    and exists (
      select 1 from public.internship_records ir
      where ir.id = record_id and ir.student_id = (select auth.uid())
    )
  )
  or (select public.is_admin())
);

drop policy if exists evaluations_update on public.evaluations;
create policy evaluations_update on public.evaluations
for update to authenticated
using ((advisor_id = (select auth.uid()) and public.advises_student(student_id)) or (select public.is_admin()))
with check ((advisor_id = (select auth.uid()) and public.advises_student(student_id)) or (select public.is_admin()));

drop policy if exists supervision_update on public.supervision_records;
create policy supervision_update on public.supervision_records
for update to authenticated
using ((advisor_id = (select auth.uid()) and public.advises_student(student_id)) or (select public.is_admin()))
with check ((advisor_id = (select auth.uid()) and public.advises_student(student_id)) or (select public.is_admin()));

-- RLS does not replace table privileges. Remove dangerous blanket privileges.
revoke all privileges on all tables in schema public from anon;
revoke truncate, references, trigger on all tables in schema public from authenticated;

-- Private uploads: enforce reasonable server-side limits and MIME allowlists.
update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array[
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/webp'
    ]::text[]
where id in ('internship-evidence', 'resumes', 'student-documents', 'supervision-attachments');

commit;
