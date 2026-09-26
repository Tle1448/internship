begin;

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

revoke all on function public.update_application_status_with_evidence(uuid, text, text[], text)
  from public, anon;
grant execute on function public.update_application_status_with_evidence(uuid, text, text[], text)
  to authenticated;

commit;
