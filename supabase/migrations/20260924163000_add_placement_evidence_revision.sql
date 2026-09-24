begin;

create or replace function public.decline_placement_verification(
  application_id uuid,
  verification_note text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  p_application_id constant uuid := application_id;
  p_verification_note constant text := nullif(trim(verification_note), '');
  application_row public.job_applications%rowtype;
begin
  if private.current_role() <> 'coordinator' then
    raise exception 'Only coordinators can return placement evidence';
  end if;
  if p_verification_note is null then
    raise exception 'A reason is required when returning placement evidence';
  end if;

  select ja.* into application_row
  from public.job_applications ja
  where ja.id = p_application_id
  for update;

  if not found then
    raise exception 'Application was not found';
  end if;
  if application_row.application_status <> 'offer_received'
     or application_row.placement_request_status <> 'pending_verification' then
    raise exception 'This application is not awaiting placement verification';
  end if;

  update public.job_applications ja
  set placement_request_status = 'declined',
      placement_verified_by = (select auth.uid()),
      placement_verified_at = now(),
      placement_verification_note = p_verification_note,
      updated_at = now()
  where ja.id = p_application_id;

  insert into public.notifications (
    recipient_type,
    recipient_id,
    title,
    message,
    job_application_id
  ) values (
    'student',
    application_row.student_id,
    'กรุณาแก้ไขหลักฐานที่ฝึกงาน',
    application_row.company_name || ': ' || p_verification_note,
    p_application_id
  );
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
  p_application_id constant uuid := application_id;
  p_evidence_files constant text[] := evidence_files;
  p_offer_note constant text := offer_note;
  application_row public.job_applications%rowtype;
begin
  if private.current_role() <> 'student' then
    raise exception 'Only students can request placement verification';
  end if;

  select ja.* into application_row
  from public.job_applications ja
  where ja.id = p_application_id
    and ja.student_id = (select auth.uid())
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
  if coalesce(array_length(p_evidence_files, 1), 0) = 0 then
    raise exception 'At least one offer evidence file is required';
  end if;

  update public.job_applications ja
  set offer_evidence_files = case
        when application_row.placement_request_status = 'declined'
          then application_row.offer_evidence_files || p_evidence_files
        else p_evidence_files
      end,
      offer_note = nullif(trim(p_offer_note), ''),
      placement_request_status = 'pending_verification',
      placement_requested_at = now(),
      updated_at = now()
  where ja.id = p_application_id;

  insert into public.notifications (
    recipient_type,
    recipient_id,
    title,
    message,
    job_application_id
  ) values (
    'coordinator',
    null,
    case
      when application_row.placement_request_status = 'declined'
        then 'นักศึกษาส่งหลักฐานที่ฝึกงานเพิ่มเติม'
      else 'มีคำขอยืนยันที่ฝึกงานใหม่'
    end,
    application_row.job_title || ' ที่ ' || application_row.company_name || ' รอการตรวจสอบหลักฐาน',
    p_application_id
  );
end;
$$;

revoke all on function public.decline_placement_verification(uuid, text)
  from public, anon;
revoke all on function public.request_placement_verification(uuid, text[], text)
  from public, anon;
grant execute on function public.decline_placement_verification(uuid, text)
  to authenticated;
grant execute on function public.request_placement_verification(uuid, text[], text)
  to authenticated;

commit;
