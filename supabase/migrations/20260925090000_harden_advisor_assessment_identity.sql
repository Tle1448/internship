begin;

alter table public.evaluations
  add column if not exists archived_at timestamptz,
  add column if not exists archive_reason text;

-- Preserve invalid legacy drafts for audit without exposing them as active work.
update public.evaluations e
set archived_at = now(),
    archive_reason = 'Archived because the evaluation advisor did not match the assigned internship advisor'
from public.internship_records ir
where ir.id = e.record_id
  and e.archived_at is null
  and (
    e.student_id is distinct from ir.student_id
    or e.advisor_id is distinct from ir.advisor_id
  );

create or replace function private.assert_advisor_record_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  internship_student_id uuid;
  internship_advisor_id uuid;
  internship_placement_status text;
  internship_status text;
begin
  select ir.student_id, ir.advisor_id, ir.placement_status, ir.status
  into internship_student_id, internship_advisor_id, internship_placement_status, internship_status
  from public.internship_records ir
  where ir.id = new.record_id;

  if not found then
    raise exception 'The internship record was not found';
  end if;
  if new.student_id is distinct from internship_student_id then
    raise exception 'The student does not match the internship record';
  end if;
  if new.advisor_id is distinct from internship_advisor_id then
    raise exception 'The advisor does not match the internship record';
  end if;
  if internship_placement_status <> 'approved' or internship_status <> 'in_progress' then
    raise exception 'The internship placement is not active and approved';
  end if;

  return new;
end;
$$;

drop trigger if exists supervision_records_identity_guard on public.supervision_records;
create trigger supervision_records_identity_guard
before insert or update on public.supervision_records
for each row execute function private.assert_advisor_record_identity();

drop trigger if exists evaluations_identity_guard on public.evaluations;
create trigger evaluations_identity_guard
before insert or update on public.evaluations
for each row execute function private.assert_advisor_record_identity();

create or replace function private.assert_evaluation_history_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  evaluation_student_id uuid;
  evaluation_advisor_id uuid;
  evaluation_status text;
  evaluation_archived_at timestamptz;
begin
  select e.student_id, e.advisor_id, e.status, e.archived_at
  into evaluation_student_id, evaluation_advisor_id, evaluation_status, evaluation_archived_at
  from public.evaluations e
  where e.id = new.evaluation_id;

  if not found then
    raise exception 'The evaluation was not found';
  end if;
  if new.student_id is distinct from evaluation_student_id
     or new.advisor_id is distinct from evaluation_advisor_id then
    raise exception 'Evaluation history identity does not match the evaluation';
  end if;
  if evaluation_status <> 'submitted' or evaluation_archived_at is not null then
    raise exception 'History can only be saved for an active submitted evaluation';
  end if;

  return new;
end;
$$;

drop trigger if exists evaluation_history_identity_guard on public.evaluation_history;
create trigger evaluation_history_identity_guard
before insert or update on public.evaluation_history
for each row execute function private.assert_evaluation_history_identity();

create or replace function private.sync_supervision_completion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.internship_records
  set supervision_status = 'completed',
      updated_at = now()
  where id = new.record_id;

  return new;
end;
$$;

drop trigger if exists supervision_records_sync_completion on public.supervision_records;
create trigger supervision_records_sync_completion
after insert or update on public.supervision_records
for each row execute function private.sync_supervision_completion();

create or replace function private.sync_evaluation_submission()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  should_save_history boolean := false;
begin
  if new.status = 'submitted' then
    if tg_op = 'INSERT' then
      should_save_history := true;
    else
      should_save_history := old.status is distinct from new.status
        or old.total_score is distinct from new.total_score
        or old.grade is distinct from new.grade
        or old.scores is distinct from new.scores
        or old.feedback is distinct from new.feedback
        or old.notes is distinct from new.notes
        or old.date is distinct from new.date
        or old.mode is distinct from new.mode;
    end if;
  end if;

  if should_save_history then
    insert into public.evaluation_history (
      evaluation_id,
      student_id,
      advisor_id,
      total_score,
      grade
    ) values (
      new.id,
      new.student_id,
      new.advisor_id,
      new.total_score,
      new.grade
    );

    update public.internship_records
    set evaluation_status = 'completed',
        updated_at = now()
    where id = new.record_id;
  end if;

  return new;
end;
$$;

drop trigger if exists evaluations_sync_submission on public.evaluations;
create trigger evaluations_sync_submission
after insert or update on public.evaluations
for each row execute function private.sync_evaluation_submission();

drop policy if exists supervision_insert on public.supervision_records;
create policy supervision_insert on public.supervision_records
for insert to authenticated
with check (
  (
    advisor_id = (select auth.uid())
    and exists (
      select 1 from public.internship_records ir
      where ir.id = supervision_records.record_id
        and ir.student_id = supervision_records.student_id
        and ir.advisor_id = (select auth.uid())
        and ir.placement_status = 'approved'
        and ir.status = 'in_progress'
    )
  )
  or (select public.is_admin())
);

drop policy if exists supervision_update on public.supervision_records;
create policy supervision_update on public.supervision_records
for update to authenticated
using (
  (
    advisor_id = (select auth.uid())
    and exists (
      select 1 from public.internship_records ir
      where ir.id = supervision_records.record_id
        and ir.student_id = supervision_records.student_id
        and ir.advisor_id = (select auth.uid())
        and ir.placement_status = 'approved'
        and ir.status = 'in_progress'
    )
  )
  or (select public.is_admin())
)
with check (
  (
    advisor_id = (select auth.uid())
    and exists (
      select 1 from public.internship_records ir
      where ir.id = supervision_records.record_id
        and ir.student_id = supervision_records.student_id
        and ir.advisor_id = (select auth.uid())
        and ir.placement_status = 'approved'
        and ir.status = 'in_progress'
    )
  )
  or (select public.is_admin())
);

drop policy if exists evaluations_insert on public.evaluations;
create policy evaluations_insert on public.evaluations
for insert to authenticated
with check (
  (
    advisor_id = (select auth.uid())
    and archived_at is null
    and exists (
      select 1 from public.internship_records ir
      where ir.id = evaluations.record_id
        and ir.student_id = evaluations.student_id
        and ir.advisor_id = (select auth.uid())
        and ir.placement_status = 'approved'
        and ir.status = 'in_progress'
    )
  )
  or (select public.is_admin())
);

drop policy if exists evaluations_update on public.evaluations;
create policy evaluations_update on public.evaluations
for update to authenticated
using (
  (
    advisor_id = (select auth.uid())
    and archived_at is null
    and exists (
      select 1 from public.internship_records ir
      where ir.id = evaluations.record_id
        and ir.student_id = evaluations.student_id
        and ir.advisor_id = (select auth.uid())
        and ir.placement_status = 'approved'
        and ir.status = 'in_progress'
    )
  )
  or (select public.is_admin())
)
with check (
  (
    advisor_id = (select auth.uid())
    and archived_at is null
    and exists (
      select 1 from public.internship_records ir
      where ir.id = evaluations.record_id
        and ir.student_id = evaluations.student_id
        and ir.advisor_id = (select auth.uid())
        and ir.placement_status = 'approved'
        and ir.status = 'in_progress'
    )
  )
  or (select public.is_admin())
);

drop policy if exists evaluations_select on public.evaluations;
create policy evaluations_select on public.evaluations
for select to authenticated
using (
  (
    student_id = (select auth.uid())
    and status = 'submitted'
    and archived_at is null
  )
  or (
    advisor_id = (select auth.uid())
    and archived_at is null
    and exists (
      select 1 from public.internship_records ir
      where ir.id = evaluations.record_id
        and ir.student_id = evaluations.student_id
        and ir.advisor_id = (select auth.uid())
    )
  )
  or public.is_coordinator()
  or public.is_admin()
);

-- History is created by the evaluation trigger so clients cannot forge it.
drop policy if exists evaluation_history_insert on public.evaluation_history;

commit;
