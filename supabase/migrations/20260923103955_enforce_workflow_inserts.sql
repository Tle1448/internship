begin;

create unique index if not exists internship_records_student_unique_idx
  on public.internship_records (student_id);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'internship_status_check') then
    alter table public.internship_records
      add constraint internship_status_check
      check (status in ('in_progress', 'completed', 'cancelled')) not valid;
    alter table public.internship_records validate constraint internship_status_check;
  end if;
end
$$;

drop policy if exists job_applications_insert on public.job_applications;
create policy job_applications_insert on public.job_applications
for insert to authenticated
with check (
  student_id = (select auth.uid())
  and (select public.is_student())
  and status = 'pending'
  and reviewed_by is null
  and reviewed_at is null
);

drop policy if exists external_insert on public.external_company_submissions;
create policy external_insert on public.external_company_submissions
for insert to authenticated
with check (
  student_id = (select auth.uid())
  and (select public.is_student())
  and status = 'pending'
  and reviewed_by is null
  and reviewed_at is null
);

drop policy if exists legacy_applications_insert on public.applications;
create policy legacy_applications_insert on public.applications
for insert to authenticated
with check (
  student_id = (select auth.uid())
  and (select public.is_student())
  and status = 'pending'
  and decided_at is null
);

drop policy if exists internship_insert on public.internship_records;
create policy internship_insert on public.internship_records
for insert to authenticated
with check (
  (
    student_id = (select auth.uid())
    and (select public.is_student())
    and advisor_id is null
    and company_id is null
    and job_application_id is null
    and status = 'in_progress'
    and placement_status = 'pending'
    and supervision_status = 'pending'
    and evaluation_status = 'pending'
  )
  or (select public.is_coordinator())
  or (select public.is_admin())
);

drop policy if exists documents_insert on public.student_documents;
create policy documents_insert on public.student_documents
for insert to authenticated
with check (
  student_id = (select auth.uid())
  and (select public.is_student())
  and status = 'pending'
  and reviewed_by is null
  and reviewed_at is null
);

drop policy if exists evaluations_insert on public.evaluations;
create policy evaluations_insert on public.evaluations
for insert to authenticated
with check (
  (
    advisor_id = (select auth.uid())
    and public.advises_student(student_id)
    and exists (
      select 1 from public.internship_records ir
      where ir.id = record_id and ir.student_id = student_id and ir.advisor_id = (select auth.uid())
    )
  )
  or (select public.is_admin())
);

drop policy if exists supervision_insert on public.supervision_records;
create policy supervision_insert on public.supervision_records
for insert to authenticated
with check (
  (
    advisor_id = (select auth.uid())
    and public.advises_student(student_id)
    and exists (
      select 1 from public.internship_records ir
      where ir.id = record_id and ir.student_id = student_id and ir.advisor_id = (select auth.uid())
    )
  )
  or (select public.is_admin())
);

-- Convert legacy public object URLs to private object paths in-place.
update public.profiles
set resume_url = regexp_replace(
  resume_url,
  '^https?://[^/]+/storage/v1/object/public/resumes/',
  ''
)
where resume_url ~ '^https?://[^/]+/storage/v1/object/public/resumes/';

update public.internship_records ir
set evidence_files = (
  select coalesce(array_agg(
    regexp_replace(
      item,
      '^https?://[^/]+/storage/v1/object/public/internship-evidence/',
      ''
    )
    order by ordinal
  ), '{}'::text[])
  from unnest(ir.evidence_files) with ordinality as files(item, ordinal)
)
where exists (
  select 1
  from unnest(ir.evidence_files) as item
  where item ~ '^https?://[^/]+/storage/v1/object/public/internship-evidence/'
);

comment on table public.applications is
  'Legacy application table. New job-board applications must use public.job_applications; external requests use public.external_company_submissions.';

commit;
