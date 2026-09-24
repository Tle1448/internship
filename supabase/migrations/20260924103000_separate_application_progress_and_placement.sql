begin;

-- Keep the former coordinator-review value for audit while new screens use
-- application_status and placement_request_status independently.
alter table public.job_applications
  add column if not exists legacy_status text,
  add column if not exists application_status text not null default 'submitted',
  add column if not exists placement_request_status text not null default 'not_requested',
  add column if not exists offer_evidence_files text[] not null default '{}'::text[],
  add column if not exists offer_note text,
  add column if not exists placement_requested_at timestamptz,
  add column if not exists placement_verified_by uuid references public.profiles(id) on delete set null,
  add column if not exists placement_verified_at timestamptz,
  add column if not exists placement_verification_note text,
  add column if not exists external_submission_id uuid references public.external_company_submissions(id) on delete set null;

update public.job_applications ja
set legacy_status = coalesce(ja.legacy_status, ja.status),
    application_status = case
      when ja.status = 'rejected' then 'rejected'
      when ja.status = 'cancelled' then 'withdrawn'
      when ja.status = 'approved' and exists (
        select 1 from public.internship_records ir
        where ir.job_application_id = ja.id and ir.placement_status = 'approved'
      ) then 'offer_received'
      else 'submitted'
    end,
    placement_request_status = case
      when exists (
        select 1 from public.internship_records ir
        where ir.job_application_id = ja.id and ir.placement_status = 'approved'
      ) then 'confirmed'
      else 'not_requested'
    end
where ja.legacy_status is null;

alter table public.job_applications
  drop constraint if exists job_applications_application_status_check,
  add constraint job_applications_application_status_check
    check (application_status in ('submitted', 'interview', 'offer_received', 'rejected', 'withdrawn')),
  drop constraint if exists job_applications_placement_request_status_check,
  add constraint job_applications_placement_request_status_check
    check (placement_request_status in ('not_requested', 'pending_verification', 'confirmed', 'declined'));

drop index if exists public.job_applications_one_pending_job_idx;
create index if not exists job_applications_application_status_idx
  on public.job_applications (application_status, submitted_at desc);
create index if not exists job_applications_placement_request_idx
  on public.job_applications (placement_request_status, placement_requested_at desc);
create index if not exists job_applications_external_submission_idx
  on public.job_applications (external_submission_id);

-- The old trigger treated an administrative review as a confirmed placement.
drop trigger if exists job_applications_process_decision on public.job_applications;
drop function if exists private.process_job_application_decision();

create or replace function private.guard_job_application_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actor_role text := private.current_role();
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') or actor_role = 'admin' then
    return new;
  end if;

  if actor_role = 'student'
     and old.student_id = (select auth.uid())
     and new.student_id is not distinct from old.student_id
     and new.job_id is not distinct from old.job_id
     and new.job_title is not distinct from old.job_title
     and new.company_name is not distinct from old.company_name
     and new.status is not distinct from old.status
     and new.legacy_status is not distinct from old.legacy_status
     and new.reason is not distinct from old.reason
     and new.reviewed_by is not distinct from old.reviewed_by
     and new.reviewed_at is not distinct from old.reviewed_at
     and new.submitted_at is not distinct from old.submitted_at
     and new.created_at is not distinct from old.created_at
     and new.external_submission_id is not distinct from old.external_submission_id
     and new.placement_verified_by is not distinct from old.placement_verified_by
     and new.placement_verified_at is not distinct from old.placement_verified_at
     and new.placement_verification_note is not distinct from old.placement_verification_note
     and new.placement_request_status is not distinct from old.placement_request_status
     and new.application_status in ('submitted', 'interview', 'offer_received', 'rejected', 'withdrawn')
     and not (old.placement_request_status in ('pending_verification', 'confirmed')
              and new.application_status is distinct from old.application_status) then
    return new;
  end if;

  raise exception 'You cannot review, verify, or reassign this application';
end;
$$;

create or replace function public.request_placement_verification(
  application_id uuid,
  evidence_files text[],
  offer_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  application_row public.job_applications%rowtype;
begin
  if private.current_role() <> 'student' then
    raise exception 'Only students can request placement verification';
  end if;

  select * into application_row
  from public.job_applications
  where id = application_id and student_id = (select auth.uid())
  for update;

  if not found then
    raise exception 'Application was not found';
  end if;
  if application_row.application_status <> 'offer_received' then
    raise exception 'An offer must be reported before requesting verification';
  end if;
  if application_row.placement_request_status not in ('not_requested', 'declined') then
    raise exception 'This placement has already been submitted for verification';
  end if;
  if coalesce(array_length(evidence_files, 1), 0) = 0 then
    raise exception 'At least one offer evidence file is required';
  end if;

  update public.job_applications
  set offer_evidence_files = evidence_files,
      offer_note = nullif(trim(offer_note), ''),
      placement_request_status = 'pending_verification',
      placement_requested_at = now(),
      updated_at = now()
  where id = application_id;

  insert into public.notifications (recipient_type, recipient_id, title, message, job_application_id)
  values (
    'coordinator',
    null,
    'มีคำขอยืนยันที่ฝึกงานใหม่',
    application_row.job_title || ' ที่ ' || application_row.company_name || ' รอการตรวจสอบหลักฐาน',
    application_id
  );
end;
$$;

create or replace function public.confirm_placement_and_assign_advisor(
  application_id uuid,
  advisor_id uuid,
  verification_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  application_row public.job_applications%rowtype;
  existing_record public.internship_records%rowtype;
  job_company_id uuid;
  advisor_name text;
  record_id uuid;
begin
  if private.current_role() <> 'coordinator' then
    raise exception 'Only coordinators can confirm a placement';
  end if;

  select * into application_row
  from public.job_applications
  where id = application_id
  for update;

  if not found then
    raise exception 'Application was not found';
  end if;
  if application_row.application_status <> 'offer_received'
     or application_row.placement_request_status <> 'pending_verification' then
    raise exception 'This application is not awaiting placement verification';
  end if;

  select full_name into advisor_name
  from public.profiles
  where id = advisor_id and role = 'advisor';
  if advisor_name is null then
    raise exception 'The selected advisor is invalid';
  end if;

  select * into existing_record
  from public.internship_records
  where student_id = application_row.student_id
  for update;

  if found and existing_record.job_application_id is distinct from application_id
     and existing_record.placement_status = 'approved' then
    raise exception 'This student already has a confirmed placement';
  end if;

  select company_id into job_company_id
  from public.jobs
  where id = application_row.job_id;

  if found then
    update public.internship_records
    set company_name = application_row.company_name,
        position = application_row.job_title,
        company_id = job_company_id,
        job_application_id = application_id,
        advisor_id = advisor_id,
        status = 'in_progress',
        placement_status = 'approved',
        updated_at = now()
    where id = existing_record.id
    returning id into record_id;
  else
    insert into public.internship_records (
      student_id, company_name, position, company_id, job_application_id,
      advisor_id, status, placement_status
    ) values (
      application_row.student_id, application_row.company_name, application_row.job_title,
      job_company_id, application_id, advisor_id, 'in_progress', 'approved'
    ) returning id into record_id;
  end if;

  update public.job_applications
  set placement_request_status = 'confirmed',
      placement_verified_by = (select auth.uid()),
      placement_verified_at = now(),
      placement_verification_note = nullif(trim(verification_note), ''),
      updated_at = now()
  where id = application_id;

  insert into public.notifications (recipient_type, recipient_id, title, message, job_application_id)
  values
    ('student', application_row.student_id, 'ยืนยันสถานที่ฝึกงานแล้ว',
      application_row.company_name || ' ได้รับการยืนยัน และมอบหมายอาจารย์ ' || advisor_name || ' แล้ว', application_id),
    ('advisor', advisor_id, 'มีนักศึกษาในความดูแลใหม่',
      'ได้รับมอบหมายให้ดูแลนักศึกษาที่ฝึกงานตำแหน่ง ' || application_row.job_title || ' ที่ ' || application_row.company_name, application_id);

  return record_id;
end;
$$;

revoke all on function public.request_placement_verification(uuid, text[], text) from public, anon;
revoke all on function public.confirm_placement_and_assign_advisor(uuid, uuid, text) from public, anon;
grant execute on function public.request_placement_verification(uuid, text[], text) to authenticated;
grant execute on function public.confirm_placement_and_assign_advisor(uuid, uuid, text) to authenticated;

commit;
