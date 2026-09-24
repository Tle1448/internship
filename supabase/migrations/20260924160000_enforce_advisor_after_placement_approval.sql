begin;

-- Keep the internship record and application history, but remove assignments
-- that were created before the placement completed coordinator verification.
update public.internship_records
set advisor_id = null,
    updated_at = now()
where advisor_id is not null
  and placement_status <> 'approved';

alter table public.internship_records
  drop constraint if exists internship_records_advisor_requires_approved_placement;

alter table public.internship_records
  add constraint internship_records_advisor_requires_approved_placement
  check (advisor_id is null or placement_status = 'approved');

commit;
