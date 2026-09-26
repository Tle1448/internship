begin;

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
  appointment_scheduled_at timestamptz;
begin
  if new.appointment_id is null then
    if new.date > (now() at time zone 'Asia/Bangkok')::date then
      raise exception 'A supervision result cannot be recorded for a future date';
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE'
     and old.appointment_id is not null
     and new.appointment_id is distinct from old.appointment_id then
    raise exception 'A saved supervision result cannot be moved to another appointment';
  end if;

  select appointment.record_id, appointment.student_id, appointment.advisor_id,
         appointment.status, appointment.scheduled_at
  into appointment_record_id, appointment_student_id, appointment_advisor_id,
       appointment_status, appointment_scheduled_at
  from public.supervision_appointments appointment
  where appointment.id = new.appointment_id;

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
  if (tg_op = 'INSERT' or old.appointment_id is null)
     and appointment_scheduled_at > now() then
    raise exception 'A supervision result cannot be recorded before the appointment time';
  end if;

  return new;
end;
$$;

revoke all on function private.assert_supervision_appointment_identity()
  from public, anon, authenticated;

commit;
