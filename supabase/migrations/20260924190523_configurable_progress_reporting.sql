begin;

create table public.progress_periods (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) > 0),
  sequence_no integer not null check (sequence_no > 0),
  academic_term text not null default '',
  opens_on date not null,
  due_on date not null,
  status text not null default 'draft'
    check (status in ('draft', 'open', 'closed')),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint progress_periods_date_order check (due_on >= opens_on),
  constraint progress_periods_term_sequence_unique unique (academic_term, sequence_no)
);

create table public.progress_reports (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.progress_periods(id) on delete restrict,
  record_id uuid not null references public.internship_records(id) on delete restrict,
  student_id uuid not null references public.profiles(id) on delete restrict,
  work_summary text not null default '',
  project_progress integer not null default 0
    check (project_progress between 0 and 100),
  problems text not null default '',
  next_plan text not null default '',
  attachment_paths text[] not null default '{}',
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'revision_required', 'approved')),
  submitted_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete restrict,
  reviewed_at timestamptz,
  advisor_feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint progress_reports_record_period_unique unique (record_id, period_id)
);

create index progress_periods_status_dates_idx
  on public.progress_periods (status, opens_on, due_on);
create index progress_reports_student_idx
  on public.progress_reports (student_id, status);
create index progress_reports_record_idx
  on public.progress_reports (record_id, period_id);
create index progress_reports_period_status_idx
  on public.progress_reports (period_id, status);

alter table public.notifications
  add column if not exists progress_report_id uuid
  references public.progress_reports(id) on delete set null;

create index if not exists notifications_progress_report_idx
  on public.notifications (progress_report_id)
  where progress_report_id is not null;

create or replace function private.guard_progress_report()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
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

  if current_user in ('postgres', 'service_role', 'supabase_admin')
     or actor_role = 'admin' then
    new.updated_at := now();
    return new;
  end if;

  if tg_op = 'INSERT' then
    if actor_role <> 'student'
       or new.student_id is distinct from (select auth.uid())
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
     and old.student_id = (select auth.uid())
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
     and internship_advisor_id = (select auth.uid())
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
    new.reviewed_by := (select auth.uid());
    new.reviewed_at := now();
    new.updated_at := now();
    return new;
  end if;

  raise exception 'You cannot update this progress report';
end;
$$;

create trigger progress_reports_guard
before insert or update on public.progress_reports
for each row execute function private.guard_progress_report();

create or replace function private.notify_progress_report()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  advisor_user_id uuid;
  student_name text;
  period_title text;
begin
  select ir.advisor_id into advisor_user_id
  from public.internship_records ir
  where ir.id = new.record_id;

  select coalesce(p.full_name, p.user_code, 'นักศึกษา') into student_name
  from public.profiles p
  where p.id = new.student_id;

  select pp.title into period_title
  from public.progress_periods pp
  where pp.id = new.period_id;

  if new.status = 'submitted'
     and (tg_op = 'INSERT' or old.status is distinct from new.status)
     and advisor_user_id is not null then
    insert into public.notifications (
      recipient_type, recipient_id, title, message, progress_report_id
    ) values (
      'advisor', advisor_user_id, 'มีบันทึกความก้าวหน้าใหม่',
      student_name || ' ส่งรายงาน ' || period_title || ' รอตรวจสอบ', new.id
    );
  elsif tg_op = 'UPDATE'
        and old.status is distinct from new.status
        and new.status in ('approved', 'revision_required') then
    insert into public.notifications (
      recipient_type, recipient_id, title, message, progress_report_id
    ) values (
      'student', new.student_id,
      case when new.status = 'approved' then 'บันทึกความก้าวหน้าได้รับการอนุมัติ' else 'กรุณาแก้ไขบันทึกความก้าวหน้า' end,
      period_title || case when new.status = 'approved' then ' ได้รับการอนุมัติแล้ว' else ' มีข้อเสนอแนะจากอาจารย์' end,
      new.id
    );
  end if;

  return new;
end;
$$;

create trigger progress_reports_notify
after insert or update on public.progress_reports
for each row execute function private.notify_progress_report();

alter table public.progress_periods enable row level security;
alter table public.progress_reports enable row level security;

create policy progress_periods_select on public.progress_periods
for select to authenticated
using (true);

create policy progress_periods_insert on public.progress_periods
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and ((select public.is_coordinator()) or (select public.is_admin()))
);

create policy progress_periods_update on public.progress_periods
for update to authenticated
using ((select public.is_coordinator()) or (select public.is_admin()))
with check ((select public.is_coordinator()) or (select public.is_admin()));

create policy progress_reports_select on public.progress_reports
for select to authenticated
using (
  student_id = (select auth.uid())
  or (select public.advises_student(student_id))
  or (select public.is_coordinator())
  or (select public.is_admin())
);

create policy progress_reports_insert on public.progress_reports
for insert to authenticated
with check (
  student_id = (select auth.uid())
  and status in ('draft', 'submitted')
  and exists (
    select 1 from public.internship_records ir
    where ir.id = record_id
      and ir.student_id = (select auth.uid())
      and ir.placement_status = 'approved'
      and ir.status = 'in_progress'
  )
);

create policy progress_reports_update on public.progress_reports
for update to authenticated
using (
  student_id = (select auth.uid())
  or (select public.advises_student(student_id))
  or (select public.is_admin())
)
with check (
  student_id = (select auth.uid())
  or (select public.advises_student(student_id))
  or (select public.is_admin())
);

grant select, insert, update on public.progress_periods to authenticated;
grant select, insert, update on public.progress_reports to authenticated;
revoke delete on public.progress_periods, public.progress_reports from anon, authenticated;
revoke all on function private.guard_progress_report() from public, anon, authenticated;
revoke all on function private.notify_progress_report() from public, anon, authenticated;

comment on table public.weekly_logs is
  'Legacy weekly progress history. New progress reporting uses progress_periods and progress_reports.';

commit;
