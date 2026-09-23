create or replace function private.guard_weekly_log_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare actor_role text := private.current_role();
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') or actor_role = 'admin' then return new; end if;

  if actor_role = 'student'
     and old.student_id = (select auth.uid())
     and old.status in ('upcoming', 'revision', 'pending')
     and new.record_id is not distinct from old.record_id
     and new.student_id is not distinct from old.student_id
     and new.week is not distinct from old.week
     and new.advisor_comment is not distinct from old.advisor_comment
     and new.created_at is not distinct from old.created_at
     and new.status in ('pending', 'revision') then
    if new.status = 'pending' and new.submitted_at is null then new.submitted_at := now(); end if;
    return new;
  end if;

  if actor_role = 'advisor'
     and private.advises_student(old.student_id)
     and new.record_id is not distinct from old.record_id
     and new.student_id is not distinct from old.student_id
     and new.week is not distinct from old.week
     and new.title is not distinct from old.title
     and new.content is not distinct from old.content
     and new.submitted_at is not distinct from old.submitted_at
     and new.created_at is not distinct from old.created_at
     and new.status in ('pending', 'approved', 'revision') then
    return new;
  end if;

  raise exception 'You cannot change protected weekly log fields';
end;
$$;
