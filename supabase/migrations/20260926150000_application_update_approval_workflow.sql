begin;

alter table public.job_applications
  add column if not exists selection_outcome text not null default 'undecided';

alter table public.job_applications
  drop constraint if exists job_applications_selection_outcome_check,
  add constraint job_applications_selection_outcome_check
    check (selection_outcome in ('undecided', 'selected', 'not_selected')),
  drop constraint if exists job_applications_application_status_check,
  add constraint job_applications_application_status_check
    check (application_status in ('draft', 'submitted', 'interview', 'offer_received', 'rejected', 'withdrawn'));

alter table public.application_status_updates
  add column if not exists review_status text not null default 'approved',
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists review_note text;

alter table public.application_status_updates
  drop constraint if exists application_status_updates_review_status_check,
  add constraint application_status_updates_review_status_check
    check (review_status in ('pending', 'approved', 'rejected')),
  drop constraint if exists application_status_updates_previous_status_check,
  add constraint application_status_updates_previous_status_check
    check (previous_status in ('draft', 'submitted', 'interview', 'offer_received', 'rejected', 'withdrawn'));

update public.application_status_updates
set review_status = 'approved',
    reviewed_at = coalesce(reviewed_at, created_at)
where reviewed_at is null;

create unique index if not exists application_status_updates_one_pending_idx
  on public.application_status_updates (application_id)
  where review_status = 'pending';
create index if not exists application_status_updates_review_queue_idx
  on public.application_status_updates (review_status, created_at);

drop index if exists public.job_applications_one_active_job_idx;
create unique index job_applications_one_active_job_idx
  on public.job_applications (student_id, job_id)
  where job_id is not null
    and application_status in ('draft', 'submitted', 'interview', 'offer_received');

drop index if exists public.job_applications_one_active_external_idx;
create unique index job_applications_one_active_external_idx
  on public.job_applications (student_id, external_submission_id)
  where external_submission_id is not null
    and application_status in ('draft', 'submitted', 'interview', 'offer_received');

-- Offers no longer become placement requests automatically. The student must
-- explicitly choose one approved offer after all status evidence is reviewed.
drop trigger if exists application_status_updates_submit_offer
  on public.application_status_updates;

update public.job_applications application
set placement_request_status = 'not_requested',
    placement_requested_at = null,
    placement_verification_note = null,
    selection_outcome = 'undecided',
    updated_at = now()
where application.placement_request_status = 'pending_verification'
  and not exists (
    select 1 from public.internship_records internship
    where internship.job_application_id = application.id
      and internship.placement_status = 'approved'
  );

update public.job_applications application
set selection_outcome = 'selected'
where application.placement_request_status = 'confirmed';

update public.job_applications application
set selection_outcome = 'not_selected'
where application.selection_outcome = 'undecided'
  and exists (
    select 1 from public.job_applications selected_application
    where selected_application.student_id = application.student_id
      and selected_application.placement_request_status = 'confirmed'
  );

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
  new_application_id uuid;
begin
  if private.current_role() <> 'student' then raise exception 'Only students can start an application'; end if;
  if num_nonnulls(p_job_id, p_external_submission_id) <> 1 then raise exception 'Choose exactly one application source'; end if;
  if exists (
    select 1 from public.internship_records internship
    where internship.student_id = p_student_id
      and internship.placement_status = 'approved'
      and internship.status = 'in_progress'
  ) then raise exception 'Your internship placement has already been confirmed'; end if;

  if p_job_id is not null then
    select job.company_name, job.title into source_company_name, source_job_title
    from public.jobs job
    where job.id = p_job_id and job.status = 'open' and job.archived_at is null;
    if not found then raise exception 'This job is not available'; end if;
  else
    select submission.company_name, submission.position into source_company_name, source_job_title
    from public.external_company_submissions submission
    where submission.id = p_external_submission_id
      and submission.student_id = p_student_id
      and submission.status = 'approved';
    if not found then raise exception 'This external company has not been approved'; end if;
  end if;

  if exists (
    select 1 from public.job_applications application
    where application.student_id = p_student_id
      and application.job_id is not distinct from p_job_id
      and application.external_submission_id is not distinct from p_external_submission_id
      and application.application_status in ('draft', 'submitted', 'interview', 'offer_received')
  ) then raise exception 'An active application already exists for this position'; end if;

  insert into public.job_applications (
    student_id, job_id, external_submission_id, job_title, company_name,
    status, application_status, selection_outcome
  ) values (
    p_student_id, p_job_id, p_external_submission_id, source_job_title,
    source_company_name, 'pending', 'draft', 'undecided'
  ) returning id into new_application_id;

  return new_application_id;
exception when unique_violation then
  raise exception 'An active application already exists for this position';
end;
$$;

create or replace function public.update_application_status_with_evidence(
  application_id uuid,
  new_status text,
  evidence_files text[],
  update_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  p_application_id constant uuid := application_id;
  p_new_status constant text := lower(trim(new_status));
  p_evidence_files constant text[] := evidence_files;
  p_update_note constant text := nullif(trim(update_note), '');
  p_student_id constant uuid := (select auth.uid());
  application_row public.job_applications%rowtype;
  update_id uuid;
begin
  if private.current_role() <> 'student' then raise exception 'Only students can request an application status update'; end if;
  if p_new_status not in ('submitted', 'interview', 'offer_received', 'rejected', 'withdrawn') then raise exception 'The application status is invalid'; end if;
  if coalesce(cardinality(p_evidence_files), 0) = 0 then raise exception 'At least one evidence file is required'; end if;
  if exists (
    select 1
    from unnest(p_evidence_files) evidence(path)
    left join storage.objects stored
      on stored.bucket_id = 'internship-evidence'
     and stored.name = evidence.path
     and stored.owner_id = p_student_id::text
    where evidence.path !~ ('^' || p_student_id::text || '/status-updates/' || p_application_id::text || '/')
       or stored.id is null
  ) then raise exception 'An evidence file is missing or does not belong to this application'; end if;

  select application.* into application_row
  from public.job_applications application
  where application.id = p_application_id and application.student_id = p_student_id
  for update;
  if not found then raise exception 'Application was not found'; end if;
  if application_row.application_status in ('rejected', 'withdrawn') then raise exception 'A closed application cannot be updated'; end if;
  if application_row.application_status = p_new_status then raise exception 'Choose a different application status'; end if;
  if not (
    (application_row.application_status = 'draft' and p_new_status = 'submitted')
    or (application_row.application_status = 'submitted' and p_new_status in ('interview', 'offer_received', 'rejected', 'withdrawn'))
    or (application_row.application_status = 'interview' and p_new_status in ('offer_received', 'rejected', 'withdrawn'))
    or (application_row.application_status = 'offer_received' and p_new_status = 'withdrawn')
  ) then raise exception 'The application status cannot move backward'; end if;
  if application_row.placement_request_status in ('pending_verification', 'confirmed') then raise exception 'The application is locked during placement verification'; end if;
  if application_row.selection_outcome = 'not_selected' then raise exception 'This application was not selected as the internship placement'; end if;
  if exists (
    select 1 from public.application_status_updates status_update
    where status_update.application_id = p_application_id and status_update.review_status = 'pending'
  ) then raise exception 'This application already has an update awaiting review'; end if;
  if exists (
    select 1 from public.internship_records internship
    where internship.student_id = p_student_id
      and internship.placement_status = 'approved'
      and internship.status = 'in_progress'
  ) then raise exception 'Your internship placement has already been confirmed'; end if;

  insert into public.application_status_updates (
    application_id, student_id, previous_status, new_status,
    evidence_files, note, review_status
  ) values (
    p_application_id, p_student_id, application_row.application_status,
    p_new_status, p_evidence_files, p_update_note, 'pending'
  ) returning id into update_id;

  insert into public.notifications (recipient_type, recipient_id, title, message, job_application_id)
  values ('coordinator', null, 'มีคำขออัปเดตสถานะการสมัคร',
    application_row.company_name || ' · ' || application_row.job_title || ' รอตรวจสอบหลักฐาน', p_application_id);
  return update_id;
end;
$$;

create or replace function public.review_application_status_update(
  status_update_id uuid,
  decision text,
  review_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  p_update_id constant uuid := status_update_id;
  p_decision constant text := lower(trim(decision));
  p_review_note constant text := nullif(trim(review_note), '');
  update_row public.application_status_updates%rowtype;
  application_row public.job_applications%rowtype;
begin
  if private.current_role() <> 'coordinator' then raise exception 'Only coordinators can review application status updates'; end if;
  if p_decision not in ('approved', 'rejected') then raise exception 'The review decision is invalid'; end if;
  if p_decision = 'rejected' and p_review_note is null then raise exception 'A reason is required when rejecting an update'; end if;

  select status_update.* into update_row
  from public.application_status_updates status_update
  where status_update.id = p_update_id
  for update;
  if not found then raise exception 'Status update request was not found'; end if;
  if update_row.review_status <> 'pending' then raise exception 'This status update has already been reviewed'; end if;

  select application.* into application_row
  from public.job_applications application
  where application.id = update_row.application_id
  for update;
  if not found then raise exception 'Application was not found'; end if;

  if p_decision = 'approved' then
    if application_row.application_status <> update_row.previous_status then
      raise exception 'The application status changed after this request was submitted';
    end if;
    update public.job_applications application
    set application_status = update_row.new_status,
        offer_evidence_files = case when update_row.new_status = 'offer_received' then update_row.evidence_files else application.offer_evidence_files end,
        offer_note = case when update_row.new_status = 'offer_received' then update_row.note else application.offer_note end,
        updated_at = now()
    where application.id = update_row.application_id;
  end if;

  update public.application_status_updates status_update
  set review_status = p_decision,
      reviewed_by = (select auth.uid()),
      reviewed_at = now(),
      review_note = p_review_note
  where status_update.id = p_update_id;

  insert into public.notifications (recipient_type, recipient_id, title, message, job_application_id)
  values (
    'student', update_row.student_id,
    case when p_decision = 'approved' then 'สถานะการสมัครได้รับการอนุมัติ' else 'คำขออัปเดตสถานะถูกส่งกลับ' end,
    application_row.company_name || ' · ' || application_row.job_title,
    update_row.application_id
  );
  return update_row.application_id;
end;
$$;

create or replace function public.select_internship_company(application_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  p_application_id constant uuid := application_id;
  p_student_id constant uuid := (select auth.uid());
  application_row public.job_applications%rowtype;
begin
  if private.current_role() <> 'student' then raise exception 'Only students can select an internship company'; end if;
  select application.* into application_row
  from public.job_applications application
  where application.id = p_application_id and application.student_id = p_student_id
  for update;
  if not found then raise exception 'Application was not found'; end if;
  if application_row.application_status <> 'offer_received' then raise exception 'Only an approved offer can be selected'; end if;
  if application_row.placement_request_status not in ('not_requested', 'declined') then raise exception 'This company selection is already being processed'; end if;
  if exists (
    select 1 from public.application_status_updates status_update
    where status_update.application_id = p_application_id and status_update.review_status = 'pending'
  ) then raise exception 'Wait for the pending status update to be reviewed'; end if;
  if exists (
    select 1 from public.job_applications application
    where application.student_id = p_student_id
      and application.id <> p_application_id
      and application.placement_request_status in ('pending_verification', 'confirmed')
  ) then raise exception 'Another company has already been selected'; end if;
  if exists (
    select 1 from public.internship_records internship
    where internship.student_id = p_student_id and internship.placement_status = 'approved'
  ) then raise exception 'Your internship placement has already been confirmed'; end if;

  update public.job_applications application
  set selection_outcome = case when application.id = p_application_id then 'selected' else 'undecided' end,
      placement_request_status = case
        when application.id = p_application_id then 'pending_verification'
        when application.placement_request_status = 'declined' then 'not_requested'
        else application.placement_request_status
      end,
      placement_requested_at = case when application.id = p_application_id then now() else application.placement_requested_at end,
      placement_verification_note = case when application.id = p_application_id then null else application.placement_verification_note end,
      updated_at = now()
  where application.student_id = p_student_id;

  insert into public.notifications (recipient_type, recipient_id, title, message, job_application_id)
  values ('coordinator', null, 'นักศึกษาเลือกบริษัทฝึกงาน',
    application_row.company_name || ' · ' || application_row.job_title || ' รอยืนยันสถานที่ฝึกงาน', p_application_id);
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
  if private.current_role() <> 'coordinator' then raise exception 'Only coordinators can confirm a placement'; end if;
  select application.* into application_row from public.job_applications application where application.id = p_application_id for update;
  if not found then raise exception 'Application was not found'; end if;
  if application_row.application_status <> 'offer_received'
     or application_row.placement_request_status <> 'pending_verification'
     or application_row.selection_outcome <> 'selected' then
    raise exception 'This application is not awaiting placement verification';
  end if;
  select profile.full_name into advisor_name from public.profiles profile where profile.id = p_advisor_id and profile.role = 'advisor';
  if advisor_name is null then raise exception 'The selected advisor is invalid'; end if;
  select internship.* into existing_record from public.internship_records internship where internship.student_id = application_row.student_id for update;
  has_existing_record := found;
  if has_existing_record and existing_record.job_application_id is distinct from p_application_id and existing_record.placement_status = 'approved' then
    raise exception 'This student already has a confirmed placement';
  end if;
  select job.company_id into job_company_id from public.jobs job where job.id = application_row.job_id;
  if has_existing_record then
    update public.internship_records internship
    set company_name = application_row.company_name, position = application_row.job_title,
        company_id = job_company_id, job_application_id = p_application_id,
        advisor_id = p_advisor_id, status = 'in_progress', placement_status = 'approved', updated_at = now()
    where internship.id = existing_record.id returning internship.id into record_id;
  else
    insert into public.internship_records (
      student_id, company_name, position, company_id, job_application_id,
      advisor_id, status, placement_status
    ) values (
      application_row.student_id, application_row.company_name, application_row.job_title,
      job_company_id, p_application_id, p_advisor_id, 'in_progress', 'approved'
    ) returning id into record_id;
  end if;
  update public.job_applications application
  set placement_request_status = case when application.id = p_application_id then 'confirmed' else application.placement_request_status end,
      selection_outcome = case when application.id = p_application_id then 'selected' else 'not_selected' end,
      placement_verified_by = case when application.id = p_application_id then (select auth.uid()) else application.placement_verified_by end,
      placement_verified_at = case when application.id = p_application_id then now() else application.placement_verified_at end,
      placement_verification_note = case when application.id = p_application_id then nullif(trim(p_verification_note), '') else application.placement_verification_note end,
      updated_at = now()
  where application.student_id = application_row.student_id;
  insert into public.notifications (recipient_type, recipient_id, title, message, job_application_id)
  values
    ('student', application_row.student_id, 'ยืนยันสถานที่ฝึกงานแล้ว', application_row.company_name || ' ได้รับการยืนยัน และมอบหมายอาจารย์ ' || advisor_name || ' แล้ว', p_application_id),
    ('advisor', p_advisor_id, 'มีนักศึกษาในความดูแลใหม่', 'ได้รับมอบหมายให้ดูแลนักศึกษาที่ฝึกงานตำแหน่ง ' || application_row.job_title || ' ที่ ' || application_row.company_name, p_application_id);
  return record_id;
end;
$$;

revoke all on function public.review_application_status_update(uuid, text, text) from public, anon;
revoke all on function public.select_internship_company(uuid) from public, anon;
grant execute on function public.review_application_status_update(uuid, text, text) to authenticated;
grant execute on function public.select_internship_company(uuid) to authenticated;

commit;
