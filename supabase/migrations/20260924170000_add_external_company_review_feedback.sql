begin;

alter table public.external_company_submissions
  add column if not exists review_note text;

create or replace function public.review_external_company_submission(
  submission_id uuid,
  decision text,
  review_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  p_submission_id constant uuid := submission_id;
  p_decision constant text := decision;
  p_review_note constant text := nullif(trim(review_note), '');
  submission_row public.external_company_submissions%rowtype;
  notification_title text;
  notification_message text;
begin
  if private.current_role() <> 'coordinator' then
    raise exception 'Only coordinators can review external company submissions';
  end if;
  if p_decision not in ('approved', 'rejected') then
    raise exception 'The review decision is invalid';
  end if;
  if p_decision = 'rejected' and p_review_note is null then
    raise exception 'A reason is required when rejecting an external company';
  end if;

  select ecs.* into submission_row
  from public.external_company_submissions ecs
  where ecs.id = p_submission_id
  for update;

  if not found then
    raise exception 'External company submission was not found';
  end if;
  if submission_row.status <> 'pending' then
    raise exception 'This external company submission has already been reviewed';
  end if;

  update public.external_company_submissions ecs
  set status = p_decision,
      review_note = p_review_note,
      reviewed_by = (select auth.uid()),
      reviewed_at = now(),
      updated_at = now()
  where ecs.id = p_submission_id;

  notification_title := case p_decision
    when 'approved' then 'บริษัทภายนอกได้รับการอนุมัติ'
    else 'บริษัทภายนอกไม่ผ่านการอนุมัติ'
  end;
  notification_message := submission_row.company_name || ' · ' || submission_row.position;
  if p_review_note is not null then
    notification_message := notification_message || ': ' || p_review_note;
  end if;

  insert into public.notifications (
    recipient_type,
    recipient_id,
    title,
    message
  ) values (
    'student',
    submission_row.student_id,
    notification_title,
    notification_message
  );
end;
$$;

revoke all on function public.review_external_company_submission(uuid, text, text)
  from public, anon;
grant execute on function public.review_external_company_submission(uuid, text, text)
  to authenticated;

commit;
