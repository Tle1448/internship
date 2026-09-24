begin;

create table if not exists public.supervision_appointments (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.internship_records(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete restrict,
  advisor_id uuid not null references public.profiles(id) on delete restrict,
  scheduled_at timestamptz not null,
  mode text not null check (mode in ('onsite', 'online')),
  location text not null default '',
  note text,
  status text not null default 'scheduled' check (status in ('scheduled', 'cancelled', 'completed')),
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists supervision_appointments_advisor_schedule_idx
  on public.supervision_appointments (advisor_id, scheduled_at)
  where status = 'scheduled';

create index if not exists supervision_appointments_student_schedule_idx
  on public.supervision_appointments (student_id, scheduled_at desc);

create unique index if not exists supervision_appointments_advisor_slot_idx
  on public.supervision_appointments (advisor_id, scheduled_at)
  where status = 'scheduled';

alter table public.notifications
  add column if not exists supervision_appointment_id uuid
  references public.supervision_appointments(id) on delete set null;

create index if not exists notifications_supervision_appointment_idx
  on public.notifications (supervision_appointment_id);

create or replace function private.guard_supervision_appointment()
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
  if new.status = 'scheduled' and new.scheduled_at <= now() then
    raise exception 'The appointment must be scheduled in the future';
  end if;

  if new.status = 'cancelled' then
    new.cancelled_at := coalesce(new.cancelled_at, now());
  else
    new.cancelled_at := null;
  end if;
  new.updated_at := now();

  return new;
end;
$$;

drop trigger if exists supervision_appointments_guard on public.supervision_appointments;
create trigger supervision_appointments_guard
before insert or update on public.supervision_appointments
for each row execute function private.guard_supervision_appointment();

create or replace function private.notify_supervision_appointment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  appointment_time text;
  notification_title text;
  notification_message text;
begin
  if tg_op = 'UPDATE'
     and new.scheduled_at is not distinct from old.scheduled_at
     and new.mode is not distinct from old.mode
     and new.location is not distinct from old.location
     and new.note is not distinct from old.note
     and new.status is not distinct from old.status then
    return new;
  end if;

  appointment_time := to_char(new.scheduled_at at time zone 'Asia/Bangkok', 'DD/MM/YYYY HH24:MI');

  if new.status = 'cancelled' then
    notification_title := 'ยกเลิกนัดหมายนิเทศ';
    notification_message := 'นัดหมายนิเทศวันที่ ' || appointment_time || ' ถูกยกเลิก';
  elsif tg_op = 'INSERT' then
    notification_title := 'มีนัดหมายนิเทศใหม่';
    notification_message := 'อาจารย์ได้นัดหมายนิเทศวันที่ ' || appointment_time;
  else
    notification_title := 'แก้ไขนัดหมายนิเทศ';
    notification_message := 'นัดหมายนิเทศถูกแก้ไขเป็นวันที่ ' || appointment_time;
  end if;

  if new.status <> 'completed' then
    insert into public.notifications (
      recipient_type,
      recipient_id,
      title,
      message,
      supervision_appointment_id
    ) values (
      'student',
      new.student_id,
      notification_title,
      notification_message,
      new.id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists supervision_appointments_notify on public.supervision_appointments;
create trigger supervision_appointments_notify
after insert or update on public.supervision_appointments
for each row execute function private.notify_supervision_appointment();

alter table public.supervision_appointments enable row level security;

drop policy if exists supervision_appointments_select on public.supervision_appointments;
create policy supervision_appointments_select on public.supervision_appointments
for select to authenticated
using (
  student_id = (select auth.uid())
  or advisor_id = (select auth.uid())
  or (select public.is_coordinator())
  or (select public.is_admin())
);

drop policy if exists supervision_appointments_insert on public.supervision_appointments;
create policy supervision_appointments_insert on public.supervision_appointments
for insert to authenticated
with check (
  (
    advisor_id = (select auth.uid())
    and status = 'scheduled'
    and exists (
      select 1
      from public.internship_records ir
      where ir.id = supervision_appointments.record_id
        and ir.student_id = supervision_appointments.student_id
        and ir.advisor_id = (select auth.uid())
        and ir.placement_status = 'approved'
        and ir.status = 'in_progress'
    )
  )
  or (select public.is_admin())
);

drop policy if exists supervision_appointments_update on public.supervision_appointments;
create policy supervision_appointments_update on public.supervision_appointments
for update to authenticated
using (
  advisor_id = (select auth.uid())
  or (select public.is_admin())
)
with check (
  (
    advisor_id = (select auth.uid())
    and exists (
      select 1
      from public.internship_records ir
      where ir.id = supervision_appointments.record_id
        and ir.student_id = supervision_appointments.student_id
        and ir.advisor_id = (select auth.uid())
        and ir.placement_status = 'approved'
        and ir.status = 'in_progress'
    )
  )
  or (select public.is_admin())
);

grant select, insert, update on public.supervision_appointments to authenticated;
revoke delete on public.supervision_appointments from anon, authenticated;
revoke all on function private.guard_supervision_appointment() from public, anon, authenticated;
revoke all on function private.notify_supervision_appointment() from public, anon, authenticated;

commit;
