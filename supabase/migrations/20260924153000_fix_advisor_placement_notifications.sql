begin;

alter table public.notifications
  drop constraint if exists notifications_recipient_type_check;

alter table public.notifications
  add constraint notifications_recipient_type_check
  check (recipient_type in ('student', 'coordinator', 'advisor', 'admin'));

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

  if not found then
    raise exception 'Application was not found';
  end if;
  if application_row.application_status <> 'offer_received'
     or application_row.placement_request_status <> 'pending_verification' then
    raise exception 'This application is not awaiting placement verification';
  end if;

  select p.full_name into advisor_name
  from public.profiles p
  where p.id = p_advisor_id and p.role = 'advisor';

  if advisor_name is null then
    raise exception 'The selected advisor is invalid';
  end if;

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
      student_id,
      company_name,
      position,
      company_id,
      job_application_id,
      advisor_id,
      status,
      placement_status
    ) values (
      application_row.student_id,
      application_row.company_name,
      application_row.job_title,
      job_company_id,
      p_application_id,
      p_advisor_id,
      'in_progress',
      'approved'
    )
    returning id into record_id;
  end if;

  update public.job_applications ja
  set placement_request_status = 'confirmed',
      placement_verified_by = (select auth.uid()),
      placement_verified_at = now(),
      placement_verification_note = nullif(trim(p_verification_note), ''),
      updated_at = now()
  where ja.id = p_application_id;

  insert into public.notifications (
    recipient_type,
    recipient_id,
    title,
    message,
    job_application_id
  ) values
    (
      'student',
      application_row.student_id,
      'ยืนยันสถานที่ฝึกงานแล้ว',
      application_row.company_name || ' ได้รับการยืนยัน และมอบหมายอาจารย์ ' || advisor_name || ' แล้ว',
      p_application_id
    ),
    (
      'advisor',
      p_advisor_id,
      'มีนักศึกษาในความดูแลใหม่',
      'ได้รับมอบหมายให้ดูแลนักศึกษาที่ฝึกงานตำแหน่ง ' || application_row.job_title || ' ที่ ' || application_row.company_name,
      p_application_id
    );

  return record_id;
end;
$$;

revoke all on function public.confirm_placement_and_assign_advisor(uuid, uuid, text)
  from public, anon;
grant execute on function public.confirm_placement_and_assign_advisor(uuid, uuid, text)
  to authenticated;

commit;
