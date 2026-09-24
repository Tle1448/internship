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
  has_existing_record boolean := false;
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
  has_existing_record := found;

  if has_existing_record and existing_record.job_application_id is distinct from application_id
     and existing_record.placement_status = 'approved' then
    raise exception 'This student already has a confirmed placement';
  end if;

  select company_id into job_company_id
  from public.jobs
  where id = application_row.job_id;

  if has_existing_record then
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
