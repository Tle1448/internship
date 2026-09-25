begin;

create or replace function private.notify_legacy_progress_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.review_status is distinct from old.review_status
     and new.review_status in ('approved', 'rejected')
     and new.student_id is not null then
    insert into public.notifications (
      recipient_type,
      recipient_id,
      title,
      message
    ) values (
      'student',
      new.student_id,
      case
        when new.review_status = 'approved' then 'ความคืบหน้าการฝึกงานได้รับการอนุมัติ'
        else 'ความคืบหน้าการฝึกงานไม่ผ่านการอนุมัติ'
      end,
      coalesce(new.company_name, 'สถานที่ฝึกงาน')
        || ' · '
        || coalesce(new.position, 'ความคืบหน้าการฝึกงาน')
        || case
          when new.review_status = 'approved' then ' ได้รับการอนุมัติแล้ว'
          else ' กรุณาตรวจสอบและติดต่ออาจารย์ที่ปรึกษา'
        end
    );
  end if;

  return new;
end;
$$;

drop trigger if exists internship_records_progress_review_notification on public.internship_records;
create trigger internship_records_progress_review_notification
after update of review_status on public.internship_records
for each row
execute function private.notify_legacy_progress_review();

revoke all on function private.notify_legacy_progress_review() from public, anon, authenticated;

commit;
