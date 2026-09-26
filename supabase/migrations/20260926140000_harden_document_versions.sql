begin;

create or replace function private.guard_student_document_insert()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actor_role text := private.current_role();
  previous_document public.student_documents%rowtype;
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') or actor_role in ('admin', 'coordinator') then
    return new;
  end if;

  if actor_role <> 'student' or new.student_id is distinct from (select auth.uid()) then
    raise exception 'Only the document owner can submit this document';
  end if;

  new.status := 'pending';
  new.comment := null;
  new.reviewed_by := null;
  new.reviewed_at := null;
  new.submitted_at := now();

  if new.supersedes_id is null then
    new.version := 1;
    new.document_group_id := coalesce(new.document_group_id, gen_random_uuid());
    return new;
  end if;

  select document.* into previous_document
  from public.student_documents document
  where document.id = new.supersedes_id
    and document.student_id = new.student_id
    and document.internship_record_id = new.internship_record_id
  for update;

  if not found or previous_document.status <> 'needs_edit' then
    raise exception 'Only a document returned for revision can be superseded';
  end if;

  if exists (
    select 1 from public.student_documents document
    where document.supersedes_id = previous_document.id
  ) then
    raise exception 'A revised version has already been submitted';
  end if;

  new.document_type := previous_document.document_type;
  new.document_group_id := previous_document.document_group_id;
  new.version := previous_document.version + 1;
  return new;
end;
$$;

drop trigger if exists student_documents_guard_insert on public.student_documents;
create trigger student_documents_guard_insert
before insert on public.student_documents
for each row execute function private.guard_student_document_insert();

drop policy if exists documents_update on public.student_documents;
create policy documents_update on public.student_documents
for update to authenticated
using (
  exists (
    select 1 from public.internship_records internship
    where internship.id = internship_record_id
      and internship.advisor_id = (select auth.uid())
  )
  or (select public.is_coordinator())
  or (select public.is_admin())
)
with check (
  exists (
    select 1 from public.internship_records internship
    where internship.id = internship_record_id
      and internship.advisor_id = (select auth.uid())
  )
  or (select public.is_coordinator())
  or (select public.is_admin())
);

commit;
