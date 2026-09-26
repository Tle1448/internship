begin;

alter table public.student_documents
  add column if not exists internship_record_id uuid
    references public.internship_records(id) on delete cascade,
  add column if not exists document_group_id uuid not null default gen_random_uuid(),
  add column if not exists version integer not null default 1,
  add column if not exists supersedes_id uuid
    references public.student_documents(id) on delete set null;

alter table public.student_documents
  drop constraint if exists student_documents_version_check;
alter table public.student_documents
  add constraint student_documents_version_check check (version > 0);

update public.student_documents document
set internship_record_id = (
  select internship.id
  from public.internship_records internship
  where internship.student_id = document.student_id
  order by internship.updated_at desc
  limit 1
)
where document.internship_record_id is null;

create index if not exists student_documents_record_status_idx
  on public.student_documents (internship_record_id, status, submitted_at desc);
create index if not exists student_documents_group_version_idx
  on public.student_documents (document_group_id, version desc);

alter table public.progress_reports
  add column if not exists assigned_tasks text not null default '',
  add column if not exists skills_learned text not null default '',
  add column if not exists hours_worked numeric(6,2) not null default 0;

alter table public.progress_reports
  drop constraint if exists progress_reports_hours_worked_check;
alter table public.progress_reports
  add constraint progress_reports_hours_worked_check
  check (hours_worked >= 0 and hours_worked <= 168);

create or replace function private.guard_student_document_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actor_role text := private.current_role();
  assigned_advisor uuid;
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') or actor_role in ('admin', 'coordinator') then
    if new.status is distinct from old.status then
      new.reviewed_by := (select auth.uid());
      new.reviewed_at := now();
    end if;
    return new;
  end if;

  if actor_role = 'advisor' then
    select internship.advisor_id into assigned_advisor
    from public.internship_records internship
    where internship.id = old.internship_record_id;

    if assigned_advisor = (select auth.uid())
       and old.status = 'pending'
       and new.status in ('approved', 'needs_edit')
       and new.id is not distinct from old.id
       and new.student_id is not distinct from old.student_id
       and new.internship_record_id is not distinct from old.internship_record_id
       and new.document_type is not distinct from old.document_type
       and new.file_name is not distinct from old.file_name
       and new.file_url is not distinct from old.file_url
       and new.document_group_id is not distinct from old.document_group_id
       and new.version is not distinct from old.version
       and new.supersedes_id is not distinct from old.supersedes_id
       and new.submitted_at is not distinct from old.submitted_at
       and (new.status <> 'needs_edit' or nullif(btrim(new.comment), '') is not null) then
      new.reviewed_by := (select auth.uid());
      new.reviewed_at := now();
      return new;
    end if;
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

drop policy if exists documents_select on public.student_documents;
create policy documents_select on public.student_documents
for select to authenticated
using (
  student_id = (select auth.uid())
  or exists (
    select 1 from public.internship_records internship
    where internship.id = internship_record_id
      and internship.advisor_id = (select auth.uid())
  )
  or (select public.is_coordinator())
  or (select public.is_admin())
);

drop policy if exists documents_insert on public.student_documents;
create policy documents_insert on public.student_documents
for insert to authenticated
with check (
  student_id = (select auth.uid())
  and (select public.is_student())
  and status = 'pending'
  and reviewed_by is null
  and reviewed_at is null
  and internship_record_id is not null
  and exists (
    select 1 from public.internship_records internship
    where internship.id = internship_record_id
      and internship.student_id = (select auth.uid())
      and internship.placement_status = 'approved'
      and internship.status = 'in_progress'
  )
);

drop policy if exists documents_update on public.student_documents;
create policy documents_update on public.student_documents
for update to authenticated
using (
  student_id = (select auth.uid())
  or exists (
    select 1 from public.internship_records internship
    where internship.id = internship_record_id
      and internship.advisor_id = (select auth.uid())
  )
  or (select public.is_coordinator())
  or (select public.is_admin())
)
with check (
  student_id = (select auth.uid())
  or exists (
    select 1 from public.internship_records internship
    where internship.id = internship_record_id
      and internship.advisor_id = (select auth.uid())
  )
  or (select public.is_coordinator())
  or (select public.is_admin())
);

drop policy if exists student_documents_storage_select on storage.objects;
create policy student_documents_storage_select on storage.objects
for select to authenticated
using (
  bucket_id = 'student-documents'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or exists (
      select 1
      from public.student_documents document
      join public.internship_records internship
        on internship.id = document.internship_record_id
      where document.file_url = name
        and internship.advisor_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.progress_reports report
      join public.internship_records internship on internship.id = report.record_id
      where name = any(report.attachment_paths)
        and internship.advisor_id = (select auth.uid())
    )
    or (select public.is_coordinator())
    or (select public.is_admin())
  )
);

create or replace function private.guard_progress_report()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_role text := private.current_role();
  internship_student_id uuid;
  internship_advisor_id uuid;
  internship_placement_status text;
  internship_status text;
  period_status text;
begin
  select internship.student_id, internship.advisor_id, internship.placement_status, internship.status
  into internship_student_id, internship_advisor_id, internship_placement_status, internship_status
  from public.internship_records internship
  where internship.id = new.record_id;

  if internship_student_id is null or new.student_id is distinct from internship_student_id then
    raise exception 'Progress report does not match the internship record';
  end if;

  select period.status into period_status
  from public.progress_periods period
  where period.id = new.period_id;

  if period_status is null then raise exception 'Progress period was not found'; end if;

  if current_user in ('postgres', 'service_role', 'supabase_admin') or actor_role = 'admin' then
    new.updated_at := now();
    return new;
  end if;

  if tg_op = 'INSERT' then
    if actor_role <> 'student'
       or new.student_id is distinct from (select auth.uid())
       or internship_placement_status <> 'approved'
       or internship_status <> 'in_progress'
       or period_status <> 'open'
       or new.status not in ('draft', 'submitted') then
      raise exception 'You cannot create this progress report';
    end if;
    new.reviewed_by := null;
    new.reviewed_at := null;
    new.advisor_feedback := null;
    new.submitted_at := case when new.status = 'submitted' then coalesce(new.submitted_at, now()) else null end;
    new.updated_at := now();
    return new;
  end if;

  if actor_role = 'student'
     and old.student_id = (select auth.uid())
     and old.status in ('draft', 'revision_required')
     and new.status in ('draft', 'submitted')
     and new.id is not distinct from old.id
     and new.period_id is not distinct from old.period_id
     and new.record_id is not distinct from old.record_id
     and new.student_id is not distinct from old.student_id
     and new.reviewed_by is not distinct from old.reviewed_by
     and new.reviewed_at is not distinct from old.reviewed_at
     and new.advisor_feedback is not distinct from old.advisor_feedback then
    new.submitted_at := case when new.status = 'submitted' then now() else null end;
    new.updated_at := now();
    return new;
  end if;

  if actor_role = 'advisor'
     and internship_advisor_id = (select auth.uid())
     and old.status in ('submitted', 'revision_required')
     and new.status in ('approved', 'revision_required')
     and new.id is not distinct from old.id
     and new.period_id is not distinct from old.period_id
     and new.record_id is not distinct from old.record_id
     and new.student_id is not distinct from old.student_id
     and new.work_summary is not distinct from old.work_summary
     and new.assigned_tasks is not distinct from old.assigned_tasks
     and new.skills_learned is not distinct from old.skills_learned
     and new.hours_worked is not distinct from old.hours_worked
     and new.project_progress is not distinct from old.project_progress
     and new.problems is not distinct from old.problems
     and new.next_plan is not distinct from old.next_plan
     and new.attachment_paths is not distinct from old.attachment_paths
     and new.submitted_at is not distinct from old.submitted_at then
    new.reviewed_by := (select auth.uid());
    new.reviewed_at := now();
    new.updated_at := now();
    return new;
  end if;

  raise exception 'You cannot update this progress report';
end;
$$;

create or replace function private.notify_student_document()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  advisor_user_id uuid;
begin
  select internship.advisor_id into advisor_user_id
  from public.internship_records internship
  where internship.id = new.internship_record_id;

  if tg_op = 'INSERT' and advisor_user_id is not null then
    insert into public.notifications (recipient_type, recipient_id, title, message)
    values ('advisor', advisor_user_id, 'มีเอกสารฝึกงานใหม่', new.document_type || ' เวอร์ชัน ' || new.version || ' รอตรวจสอบ');
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status
        and new.status in ('approved', 'needs_edit') then
    insert into public.notifications (recipient_type, recipient_id, title, message)
    values (
      'student', new.student_id,
      case when new.status = 'approved' then 'เอกสารฝึกงานผ่านการตรวจ' else 'เอกสารฝึกงานต้องแก้ไข' end,
      new.document_type || ' เวอร์ชัน ' || new.version
    );
  end if;
  return new;
end;
$$;

drop trigger if exists student_documents_notify on public.student_documents;
create trigger student_documents_notify
after insert or update on public.student_documents
for each row execute function private.notify_student_document();

commit;
