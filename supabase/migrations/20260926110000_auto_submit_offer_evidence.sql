begin;

create or replace function private.submit_offer_status_for_verification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.new_status <> 'offer_received' then
    return new;
  end if;

  update public.job_applications application
  set offer_evidence_files = new.evidence_files,
      offer_note = new.note,
      placement_request_status = 'pending_verification',
      placement_requested_at = now(),
      placement_verification_note = null,
      updated_at = now()
  where application.id = new.application_id
    and application.student_id = new.student_id
    and application.placement_request_status = 'not_requested';

  if found then
    insert into public.notifications (
      recipient_type,
      recipient_id,
      title,
      message,
      job_application_id
    )
    select
      'coordinator',
      null,
      'มีคำขอยืนยันที่ฝึกงานใหม่',
      application.job_title || ' ที่ ' || application.company_name || ' รอการตรวจสอบหลักฐาน',
      application.id
    from public.job_applications application
    where application.id = new.application_id;
  end if;

  return new;
end;
$$;

drop trigger if exists application_status_updates_submit_offer
  on public.application_status_updates;
create trigger application_status_updates_submit_offer
after insert on public.application_status_updates
for each row
execute function private.submit_offer_status_for_verification();

with pending_offers as (
  select application.id
  from public.job_applications application
  where application.application_status = 'offer_received'
    and application.placement_request_status = 'not_requested'
    and coalesce(cardinality(application.offer_evidence_files), 0) > 0
), inserted_notifications as (
  insert into public.notifications (
    recipient_type,
    recipient_id,
    title,
    message,
    job_application_id
  )
  select
    'coordinator',
    null,
    'มีคำขอยืนยันที่ฝึกงานใหม่',
    application.job_title || ' ที่ ' || application.company_name || ' รอการตรวจสอบหลักฐาน',
    application.id
  from public.job_applications application
  join pending_offers on pending_offers.id = application.id
)
update public.job_applications application
set placement_request_status = 'pending_verification',
    placement_requested_at = now(),
    placement_verification_note = null,
    updated_at = now()
from pending_offers
where application.id = pending_offers.id;

commit;
