-- Advisors may complete only their assigned student's supervision/evaluation workflow.
-- All placement, company, progress, and ownership fields remain protected.

create or replace function private.guard_internship_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare actor_role text := private.current_role();
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') or actor_role in ('admin', 'coordinator') then
    return new;
  end if;

  if actor_role = 'advisor'
     and old.advisor_id = (select auth.uid())
     and new.id is not distinct from old.id
     and new.student_id is not distinct from old.student_id
     and new.company_name is not distinct from old.company_name
     and new.position is not distinct from old.position
     and new.skills is not distinct from old.skills
     and new.progress_percent is not distinct from old.progress_percent
     and new.progress_note is not distinct from old.progress_note
     and new.status is not distinct from old.status
     and new.evidence_files is not distinct from old.evidence_files
     and new.province is not distinct from old.province
     and new.advisor_id is not distinct from old.advisor_id
     and new.company_id is not distinct from old.company_id
     and new.job_application_id is not distinct from old.job_application_id
     and new.project is not distinct from old.project
     and new.current_week is not distinct from old.current_week
     and new.placement_status is not distinct from old.placement_status
     and new.progress_health is not distinct from old.progress_health
     and new.started_at is not distinct from old.started_at
     and new.ended_at is not distinct from old.ended_at
     and new.created_at is not distinct from old.created_at then
    return new;
  end if;

  if actor_role = 'student'
     and old.student_id = (select auth.uid())
     and new.id is not distinct from old.id
     and new.student_id is not distinct from old.student_id
     and new.advisor_id is not distinct from old.advisor_id
     and new.company_id is not distinct from old.company_id
     and new.job_application_id is not distinct from old.job_application_id
     and new.status is not distinct from old.status
     and new.placement_status is not distinct from old.placement_status
     and new.progress_health is not distinct from old.progress_health
     and new.supervision_status is not distinct from old.supervision_status
     and new.evaluation_status is not distinct from old.evaluation_status
     and new.created_at is not distinct from old.created_at then
    return new;
  end if;

  raise exception 'You cannot change protected internship fields';
end;
$$;

drop policy if exists internship_update on public.internship_records;
create policy internship_update on public.internship_records
for update to authenticated
using (
  student_id = (select auth.uid())
  or advisor_id = (select auth.uid())
  or (select public.is_coordinator())
  or (select public.is_admin())
)
with check (
  student_id = (select auth.uid())
  or advisor_id = (select auth.uid())
  or (select public.is_coordinator())
  or (select public.is_admin())
);
