create or replace function private.guard_progress_report()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  actor_role text := private.current_role();
  internship_student_id uuid;
  internship_advisor_id uuid;
  internship_placement_status text;
  internship_status text;
  period_status text;
begin
  select ir.student_id, ir.advisor_id, ir.placement_status, ir.status
  into internship_student_id, internship_advisor_id, internship_placement_status, internship_status
  from public.internship_records ir
  where ir.id = new.record_id;

  if internship_student_id is null
     or new.student_id is distinct from internship_student_id then
    raise exception 'Progress report does not match the internship record';
  end if;

  select pp.status into period_status
  from public.progress_periods pp
  where pp.id = new.period_id;

  if period_status is null then
    raise exception 'Progress period was not found';
  end if;

  if actor_id is null or actor_role = 'admin' then
    new.updated_at := now();
    return new;
  end if;

  if tg_op = 'INSERT' then
    if actor_role <> 'student'
       or new.student_id is distinct from actor_id
       or internship_placement_status <> 'approved'
       or internship_status <> 'in_progress'
       or period_status <> 'open'
       or new.status not in ('draft', 'submitted') then
      raise exception 'You cannot create this progress report';
    end if;

    new.reviewed_by := null;
    new.reviewed_at := null;
    new.advisor_feedback := null;
    new.submitted_at := case when new.status = 'submitted' then coalesce(new.submitted_at, now()) else null end;
    new.updated_at := now();
    return new;
  end if;

  if actor_role = 'student'
     and old.student_id = actor_id
     and old.status in ('draft', 'revision_required')
     and new.status in ('draft', 'submitted')
     and new.id is not distinct from old.id
     and new.period_id is not distinct from old.period_id
     and new.record_id is not distinct from old.record_id
     and new.student_id is not distinct from old.student_id
     and new.reviewed_by is not distinct from old.reviewed_by
     and new.reviewed_at is not distinct from old.reviewed_at
     and new.advisor_feedback is not distinct from old.advisor_feedback then
    new.submitted_at := case when new.status = 'submitted' then now() else null end;
    new.updated_at := now();
    return new;
  end if;

  if actor_role = 'advisor'
     and internship_advisor_id = actor_id
     and old.status in ('submitted', 'revision_required')
     and new.status in ('approved', 'revision_required')
     and new.id is not distinct from old.id
     and new.period_id is not distinct from old.period_id
     and new.record_id is not distinct from old.record_id
     and new.student_id is not distinct from old.student_id
     and new.work_summary is not distinct from old.work_summary
     and new.project_progress is not distinct from old.project_progress
     and new.problems is not distinct from old.problems
     and new.next_plan is not distinct from old.next_plan
     and new.attachment_paths is not distinct from old.attachment_paths
     and new.submitted_at is not distinct from old.submitted_at then
    new.reviewed_by := actor_id;
    new.reviewed_at := now();
    new.updated_at := now();
    return new;
  end if;

  raise exception 'You cannot update this progress report';
end;
$$;

revoke all on function private.guard_progress_report() from public, anon, authenticated;
