begin;

-- Admin-only account state and company review fields used by /admin.
alter table public.profiles
  add column if not exists is_active boolean not null default true;

alter table public.companies
  add column if not exists industry text,
  add column if not exists approval_status text not null default 'pending'
    check (approval_status in ('pending', 'approved', 'suspended'));

create index if not exists profiles_role_active_idx
  on public.profiles (role, is_active);
create index if not exists companies_approval_status_idx
  on public.companies (approval_status);
create index if not exists jobs_company_status_idx
  on public.jobs (company_id, status);
create index if not exists student_documents_status_submitted_idx
  on public.student_documents (status, submitted_at desc);

-- A compact audit feed for the Admin dashboard. The feed intentionally stores
-- no document content or credentials, only the action and target identifier.
create table if not exists public.admin_activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  entity_type text not null check (entity_type in ('profile', 'company', 'job', 'application', 'document')),
  entity_id uuid,
  action text not null check (action in ('created', 'updated', 'deleted')),
  summary text not null,
  created_at timestamptz not null default now()
);

create index if not exists admin_activity_logs_created_at_idx
  on public.admin_activity_logs (created_at desc);

alter table public.admin_activity_logs enable row level security;
drop policy if exists admin_activity_logs_select_admin on public.admin_activity_logs;
create policy admin_activity_logs_select_admin on public.admin_activity_logs
  for select to authenticated using ((select public.is_admin()));

-- Admin privileges are additive: existing student/advisor/coordinator policies
-- are preserved, while these policies grant the administrator the full
-- management view required by the Admin UI.
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.jobs enable row level security;
alter table public.job_applications enable row level security;
alter table public.student_documents enable row level security;
alter table public.internship_records enable row level security;
alter table public.notifications enable row level security;

drop policy if exists admin_manage_profiles on public.profiles;
create policy admin_manage_profiles on public.profiles
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists admin_manage_companies on public.companies;
create policy admin_manage_companies on public.companies
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists admin_manage_jobs on public.jobs;
create policy admin_manage_jobs on public.jobs
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists admin_manage_job_applications on public.job_applications;
create policy admin_manage_job_applications on public.job_applications
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists admin_manage_student_documents on public.student_documents;
create policy admin_manage_student_documents on public.student_documents
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists admin_manage_internship_records on public.internship_records;
create policy admin_manage_internship_records on public.internship_records
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists admin_manage_notifications on public.notifications;
create policy admin_manage_notifications on public.notifications
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create or replace function private.log_admin_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_id uuid;
  activity_action text;
  activity_summary text;
begin
  if coalesce(private.current_role(), '') <> 'admin' then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  target_id := case when tg_op = 'DELETE' then old.id else new.id end;
  activity_action := case tg_op
    when 'INSERT' then 'created'
    when 'UPDATE' then 'updated'
    else 'deleted'
  end;
  activity_summary := case tg_table_name
    when 'profiles' then 'จัดการบัญชีผู้ใช้'
    when 'companies' then 'จัดการข้อมูลสถานประกอบการ'
    when 'jobs' then 'จัดการประกาศตำแหน่งงาน'
    when 'job_applications' then 'อัปเดตสถานะใบสมัคร'
    when 'student_documents' then 'ตรวจสอบเอกสารนักศึกษา'
    else 'จัดการข้อมูลระบบ'
  end;

  insert into public.admin_activity_logs (actor_id, entity_type, entity_id, action, summary)
  values ((select auth.uid()),
    case tg_table_name
      when 'profiles' then 'profile'
      when 'companies' then 'company'
      when 'jobs' then 'job'
      when 'job_applications' then 'application'
      else 'document'
    end,
    target_id,
    activity_action,
    activity_summary);

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists admin_activity_profiles on public.profiles;
create trigger admin_activity_profiles after insert or update or delete on public.profiles
  for each row execute function private.log_admin_activity();
drop trigger if exists admin_activity_companies on public.companies;
create trigger admin_activity_companies after insert or update or delete on public.companies
  for each row execute function private.log_admin_activity();
drop trigger if exists admin_activity_jobs on public.jobs;
create trigger admin_activity_jobs after insert or update or delete on public.jobs
  for each row execute function private.log_admin_activity();
drop trigger if exists admin_activity_job_applications on public.job_applications;
create trigger admin_activity_job_applications after insert or update or delete on public.job_applications
  for each row execute function private.log_admin_activity();
drop trigger if exists admin_activity_student_documents on public.student_documents;
create trigger admin_activity_student_documents after insert or update or delete on public.student_documents
  for each row execute function private.log_admin_activity();

revoke all on function private.log_admin_activity() from public, anon, authenticated;
grant execute on function private.log_admin_activity() to service_role;

commit;
