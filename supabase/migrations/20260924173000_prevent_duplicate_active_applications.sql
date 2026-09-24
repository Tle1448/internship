begin;

-- A confirmed placement closes every other active application for that student.
update public.job_applications ja
set application_status = 'withdrawn',
    placement_request_status = case
      when placement_request_status = 'pending_verification' then 'declined'
      else placement_request_status
    end,
    placement_verification_note = case
      when placement_request_status = 'pending_verification'
        then 'ปิดอัตโนมัติเนื่องจากนักศึกษายืนยันสถานที่ฝึกงานอื่นแล้ว'
      else placement_verification_note
    end,
    updated_at = now()
where ja.application_status in ('submitted', 'interview', 'offer_received')
  and ja.placement_request_status <> 'confirmed'
  and exists (
    select 1
    from public.internship_records ir
    where ir.student_id = ja.student_id
      and ir.placement_status = 'approved'
      and ir.status = 'in_progress'
  );

-- Preserve every row, but close lower-priority active duplicates. A row already
-- linked to an internship record wins; otherwise the newest row wins.
with ranked_applications as (
  select
    ja.id,
    row_number() over (
      partition by ja.student_id, ja.job_id, ja.external_submission_id
      order by
        exists (
          select 1 from public.internship_records ir
          where ir.job_application_id = ja.id
        ) desc,
        ja.submitted_at desc,
        ja.id desc
    ) as duplicate_rank
  from public.job_applications ja
  where ja.application_status in ('submitted', 'interview', 'offer_received')
    and (ja.job_id is not null or ja.external_submission_id is not null)
)
update public.job_applications ja
set application_status = 'withdrawn',
    updated_at = now()
from ranked_applications ranked
where ja.id = ranked.id
  and ranked.duplicate_rank > 1;

create unique index if not exists job_applications_one_active_job_idx
  on public.job_applications (student_id, job_id)
  where job_id is not null
    and application_status in ('submitted', 'interview', 'offer_received');

create unique index if not exists job_applications_one_active_external_idx
  on public.job_applications (student_id, external_submission_id)
  where external_submission_id is not null
    and application_status in ('submitted', 'interview', 'offer_received');

create or replace function public.start_job_application(
  job_id uuid default null,
  external_submission_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  p_job_id constant uuid := job_id;
  p_external_submission_id constant uuid := external_submission_id;
  p_student_id constant uuid := (select auth.uid());
  source_company_name text;
  source_job_title text;
  application_id uuid;
begin
  if private.current_role() <> 'student' then
    raise exception 'Only students can start an application';
  end if;
  if num_nonnulls(p_job_id, p_external_submission_id) <> 1 then
    raise exception 'Choose exactly one application source';
  end if;
  if exists (
    select 1
    from public.internship_records ir
    where ir.student_id = p_student_id
      and ir.placement_status = 'approved'
      and ir.status = 'in_progress'
  ) then
    raise exception 'Your internship placement has already been confirmed';
  end if;

  if p_job_id is not null then
    select j.company_name, j.title
    into source_company_name, source_job_title
    from public.jobs j
    where j.id = p_job_id
      and j.status = 'open'
      and j.archived_at is null;

    if not found then
      raise exception 'This job is not available';
    end if;
  else
    select ecs.company_name, ecs.position
    into source_company_name, source_job_title
    from public.external_company_submissions ecs
    where ecs.id = p_external_submission_id
      and ecs.student_id = p_student_id
      and ecs.status = 'approved';

    if not found then
      raise exception 'This external company has not been approved';
    end if;
  end if;

  if exists (
    select 1
    from public.job_applications ja
    where ja.student_id = p_student_id
      and ja.job_id is not distinct from p_job_id
      and ja.external_submission_id is not distinct from p_external_submission_id
      and ja.application_status in ('submitted', 'interview', 'offer_received')
  ) then
    raise exception 'An active application already exists for this position';
  end if;

  insert into public.job_applications (
    student_id,
    job_id,
    external_submission_id,
    job_title,
    company_name,
    status,
    application_status
  ) values (
    p_student_id,
    p_job_id,
    p_external_submission_id,
    source_job_title,
    source_company_name,
    'pending',
    'submitted'
  )
  returning id into application_id;

  return application_id;
exception
  when unique_violation then
    raise exception 'An active application already exists for this position';
end;
$$;

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
     and old.application_status not in ('rejected', 'withdrawn')
     and not exists (
       select 1 from public.internship_records ir
       where ir.student_id = old.student_id
         and ir.placement_status = 'approved'
         and ir.status = 'in_progress'
     )
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
     and not (
       old.placement_request_status in ('pending_verification', 'confirmed')
       and new.application_status is distinct from old.application_status
     ) then
    return new;
  end if;

  raise exception 'You cannot review, verify, reopen, or reassign this application';
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
  p_application_id constant uuid := application_id;
  p_advisor_id constant uuid := advisor_id;
  p_verification_note constant text := verification_note;
  application_row public.job_applications%rowtype;
  existing_record public.internship_records%rowtype;
  has_existing_record boolean := false;
  job_company_id uuid;
  advisor_name text;
  record_id uuid;
begin
  if private.current_role() <> 'coordinator' then
    raise exception 'Only coordinators can confirm a placement';
  end if;

  select ja.* into application_row
  from public.job_applications ja
  where ja.id = p_application_id
  for update;

  if not found then raise exception 'Application was not found'; end if;
  if application_row.application_status <> 'offer_received'
     or application_row.placement_request_status <> 'pending_verification' then
    raise exception 'This application is not awaiting placement verification';
  end if;

  select p.full_name into advisor_name
  from public.profiles p
  where p.id = p_advisor_id and p.role = 'advisor';
  if advisor_name is null then raise exception 'The selected advisor is invalid'; end if;

  select ir.* into existing_record
  from public.internship_records ir
  where ir.student_id = application_row.student_id
  for update;
  has_existing_record := found;

  if has_existing_record
     and existing_record.job_application_id is distinct from p_application_id
     and existing_record.placement_status = 'approved' then
    raise exception 'This student already has a confirmed placement';
  end if;

  select j.company_id into job_company_id
  from public.jobs j
  where j.id = application_row.job_id;

  if has_existing_record then
    update public.internship_records ir
    set company_name = application_row.company_name,
        position = application_row.job_title,
        company_id = job_company_id,
        job_application_id = p_application_id,
        advisor_id = p_advisor_id,
        status = 'in_progress',
        placement_status = 'approved',
        updated_at = now()
    where ir.id = existing_record.id
    returning ir.id into record_id;
  else
    insert into public.internship_records (
      student_id, company_name, position, company_id, job_application_id,
      advisor_id, status, placement_status
    ) values (
      application_row.student_id, application_row.company_name, application_row.job_title,
      job_company_id, p_application_id, p_advisor_id, 'in_progress', 'approved'
    ) returning id into record_id;
  end if;

  update public.job_applications ja
  set placement_request_status = 'confirmed',
      placement_verified_by = (select auth.uid()),
      placement_verified_at = now(),
      placement_verification_note = nullif(trim(p_verification_note), ''),
      updated_at = now()
  where ja.id = p_application_id;

  update public.job_applications ja
  set application_status = 'withdrawn',
      placement_request_status = case
        when placement_request_status = 'pending_verification' then 'declined'
        else placement_request_status
      end,
      placement_verification_note = case
        when placement_request_status = 'pending_verification'
          then 'ปิดอัตโนมัติเนื่องจากนักศึกษายืนยันสถานที่ฝึกงานอื่นแล้ว'
        else placement_verification_note
      end,
      updated_at = now()
  where ja.student_id = application_row.student_id
    and ja.id <> p_application_id
    and ja.application_status in ('submitted', 'interview', 'offer_received');

  insert into public.notifications (
    recipient_type, recipient_id, title, message, job_application_id
  ) values
    ('student', application_row.student_id, 'ยืนยันสถานที่ฝึกงานแล้ว',
      application_row.company_name || ' ได้รับการยืนยัน และมอบหมายอาจารย์ ' || advisor_name || ' แล้ว', p_application_id),
    ('advisor', p_advisor_id, 'มีนักศึกษาในความดูแลใหม่',
      'ได้รับมอบหมายให้ดูแลนักศึกษาที่ฝึกงานตำแหน่ง ' || application_row.job_title || ' ที่ ' || application_row.company_name, p_application_id);

  return record_id;
end;
$$;

revoke all on function public.start_job_application(uuid, uuid) from public, anon;
revoke all on function public.confirm_placement_and_assign_advisor(uuid, uuid, text) from public, anon;
grant execute on function public.start_job_application(uuid, uuid) to authenticated;
grant execute on function public.confirm_placement_and_assign_advisor(uuid, uuid, text) to authenticated;

commit;
