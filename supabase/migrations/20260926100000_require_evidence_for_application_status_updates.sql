begin;

create table public.application_status_updates (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.job_applications(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  previous_status text not null,
  new_status text not null,
  evidence_files text[] not null,
  note text,
  created_at timestamptz not null default now(),
  constraint application_status_updates_previous_status_check check (
    previous_status in ('submitted', 'interview', 'offer_received', 'rejected', 'withdrawn')
  ),
  constraint application_status_updates_new_status_check check (
    new_status in ('submitted', 'interview', 'offer_received', 'rejected', 'withdrawn')
  ),
  constraint application_status_updates_changed_check check (previous_status <> new_status),
  constraint application_status_updates_evidence_check check (cardinality(evidence_files) > 0)
);

create index application_status_updates_application_created_idx
  on public.application_status_updates (application_id, created_at desc);
create index application_status_updates_student_created_idx
  on public.application_status_updates (student_id, created_at desc);

alter table public.application_status_updates enable row level security;

revoke all on table public.application_status_updates from anon;
revoke all on table public.application_status_updates from authenticated;
grant select on table public.application_status_updates to authenticated;

create policy application_status_updates_select
on public.application_status_updates
for select to authenticated
using (
  student_id = (select auth.uid())
  or (select public.is_coordinator())
  or (select public.is_admin())
);

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
  if private.current_role() <> 'student' then
    raise exception 'Only students can update an application status';
  end if;
  if p_new_status not in ('submitted', 'interview', 'offer_received', 'rejected', 'withdrawn') then
    raise exception 'The application status is invalid';
  end if;
  if coalesce(cardinality(p_evidence_files), 0) = 0 then
    raise exception 'At least one evidence file is required';
  end if;
  if exists (
    select 1
    from unnest(p_evidence_files) as evidence(path)
    left join storage.objects stored
      on stored.bucket_id = 'internship-evidence'
     and stored.name = evidence.path
     and stored.owner_id = p_student_id::text
    where evidence.path !~ (
      '^' || p_student_id::text || '/status-updates/' || p_application_id::text || '/'
    )
       or stored.id is null
  ) then
    raise exception 'An evidence file is missing or does not belong to this application';
  end if;

  select application.* into application_row
  from public.job_applications application
  where application.id = p_application_id
    and application.student_id = p_student_id
  for update;

  if not found then
    raise exception 'Application was not found';
  end if;
  if application_row.application_status in ('rejected', 'withdrawn') then
    raise exception 'A closed application cannot be updated';
  end if;
  if application_row.application_status = p_new_status then
    raise exception 'Choose a different application status';
  end if;
  if application_row.placement_request_status <> 'not_requested' then
    raise exception 'The application status is locked during placement verification';
  end if;
  if exists (
    select 1
    from public.internship_records internship
    where internship.student_id = p_student_id
      and internship.placement_status = 'approved'
      and internship.status = 'in_progress'
  ) then
    raise exception 'Your internship placement has already been confirmed';
  end if;

  update public.job_applications application
  set application_status = p_new_status,
      offer_evidence_files = case
        when p_new_status = 'offer_received' then p_evidence_files
        else application.offer_evidence_files
      end,
      updated_at = now()
  where application.id = p_application_id;

  insert into public.application_status_updates (
    application_id,
    student_id,
    previous_status,
    new_status,
    evidence_files,
    note
  ) values (
    p_application_id,
    p_student_id,
    application_row.application_status,
    p_new_status,
    p_evidence_files,
    p_update_note
  )
  returning id into update_id;

  return update_id;
end;
$$;

-- Student-facing status changes must go through the evidence RPC above.
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
     and new.application_status is not distinct from old.application_status
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
     and new.placement_request_status is not distinct from old.placement_request_status then
    return new;
  end if;

  raise exception 'Application status updates require evidence';
end;
$$;

revoke all on function public.update_application_status_with_evidence(uuid, text, text[], text)
  from public, anon;
grant execute on function public.update_application_status_with_evidence(uuid, text, text[], text)
  to authenticated;

commit;
