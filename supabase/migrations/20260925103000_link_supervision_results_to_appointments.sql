begin;

alter table public.supervision_records
  add column if not exists appointment_id uuid
  references public.supervision_appointments(id) on delete restrict;

create unique index if not exists supervision_records_appointment_idx
  on public.supervision_records (appointment_id)
  where appointment_id is not null;

create or replace function private.assert_supervision_appointment_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  appointment_record_id uuid;
  appointment_student_id uuid;
  appointment_advisor_id uuid;
  appointment_status text;
begin
  if new.appointment_id is null then
    return new;
  end if;

  if tg_op = 'UPDATE'
     and old.appointment_id is not null
     and new.appointment_id is distinct from old.appointment_id then
    raise exception 'A saved supervision result cannot be moved to another appointment';
  end if;

  select a.record_id, a.student_id, a.advisor_id, a.status
  into appointment_record_id, appointment_student_id, appointment_advisor_id, appointment_status
  from public.supervision_appointments a
  where a.id = new.appointment_id;

  if not found then
    raise exception 'The supervision appointment was not found';
  end if;
  if new.record_id is distinct from appointment_record_id
     or new.student_id is distinct from appointment_student_id
     or new.advisor_id is distinct from appointment_advisor_id then
    raise exception 'The supervision result does not match the selected appointment';
  end if;
  if appointment_status = 'cancelled' then
    raise exception 'A cancelled appointment cannot receive a supervision result';
  end if;
  if (tg_op = 'INSERT' or old.appointment_id is null)
     and appointment_status <> 'scheduled' then
    raise exception 'Only a scheduled appointment can receive a new supervision result';
  end if;

  return new;
end;
$$;

drop trigger if exists supervision_records_appointment_guard on public.supervision_records;
create trigger supervision_records_appointment_guard
before insert or update on public.supervision_records
for each row execute function private.assert_supervision_appointment_identity();

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

  if new.appointment_id is not null then
    update public.supervision_appointments
    set status = 'completed',
        updated_at = now()
    where id = new.appointment_id
      and status = 'scheduled';
  end if;

  return new;
end;
$$;

revoke all on function private.assert_supervision_appointment_identity()
  from public, anon, authenticated;

commit;
