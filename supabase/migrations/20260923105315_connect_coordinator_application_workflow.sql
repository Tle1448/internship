begin;

alter table public.notifications
  add column if not exists job_application_id uuid;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'notifications_job_application_id_fkey') then
    alter table public.notifications
      add constraint notifications_job_application_id_fkey
      foreign key (job_application_id)
      references public.job_applications(id)
      on delete cascade;
  end if;
end
$$;

create index if not exists notifications_job_application_idx
  on public.notifications (job_application_id);

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
     or new.job_application_id is distinct from old.job_application_id
     or new.created_at is distinct from old.created_at then
    raise exception 'Only is_read can be changed';
  end if;
  return new;
end;
$$;

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
    elsif new.status is distinct from old.status and new.status = 'pending' then
      new.reviewed_by := null;
      new.reviewed_at := null;
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

create or replace function private.process_job_application_decision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  job_company_id uuid;
  notification_title text;
  notification_message text;
begin
  if new.status is not distinct from old.status then return new; end if;

  if new.status = 'approved' then
    select j.company_id into job_company_id
    from public.jobs j
    where j.id = new.job_id;

    insert into public.internship_records (
      student_id,
      company_name,
      position,
      company_id,
      job_application_id,
      status,
      placement_status
    )
    values (
      new.student_id,
      new.company_name,
      new.job_title,
      job_company_id,
      new.id,
      'in_progress',
      'approved'
    )
    on conflict (student_id) do update
    set company_name = excluded.company_name,
        position = excluded.position,
        company_id = excluded.company_id,
        job_application_id = excluded.job_application_id,
        status = 'in_progress',
        placement_status = 'approved',
        updated_at = now();

    notification_title := 'ใบสมัครฝึกงานได้รับการอนุมัติ';
    notification_message := 'ใบสมัครตำแหน่ง ' || new.job_title || ' ที่ ' || new.company_name || ' ได้รับการอนุมัติแล้ว';
  elsif new.status = 'rejected' then
    if old.status = 'approved' then
      update public.internship_records
      set job_application_id = null,
          placement_status = 'pending',
          updated_at = now()
      where job_application_id = new.id;
    end if;

    notification_title := 'ผลการพิจารณาใบสมัครฝึกงาน';
    notification_message := 'ใบสมัครตำแหน่ง ' || new.job_title || ' ที่ ' || new.company_name || ' ไม่ได้รับการอนุมัติ';
  elsif new.status = 'pending' and old.status in ('approved', 'rejected') then
    if old.status = 'approved' then
      update public.internship_records
      set job_application_id = null,
          placement_status = 'pending',
          updated_at = now()
      where job_application_id = new.id;
    end if;

    notification_title := 'ใบสมัครกลับสู่สถานะรอพิจารณา';
    notification_message := 'ใบสมัครตำแหน่ง ' || new.job_title || ' ที่ ' || new.company_name || ' กำลังรอการพิจารณาอีกครั้ง';
  else
    return new;
  end if;

  insert into public.notifications (
    recipient_type,
    recipient_id,
    title,
    message,
    job_application_id
  )
  values (
    'student',
    new.student_id,
    notification_title,
    notification_message,
    new.id
  );

  return new;
end;
$$;

revoke all on function private.process_job_application_decision() from public, anon, authenticated;

drop trigger if exists job_applications_process_decision on public.job_applications;
create trigger job_applications_process_decision
after update of status on public.job_applications
for each row
when (old.status is distinct from new.status)
execute function private.process_job_application_decision();

commit;
