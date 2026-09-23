begin;

alter table public.dashboard_deadlines
  drop constraint if exists dashboard_deadlines_audience_check;

update public.dashboard_deadlines
set audience = case audience
  when 'อาจารย์' then 'อาจารย์นิเทศ'
  when 'ผู้ประสานงาน' then 'อาจารย์ผู้ประสานงานสหกิจ'
  else audience
end;

alter table public.dashboard_deadlines
  add constraint dashboard_deadlines_audience_check
  check (audience in (
    'อาจารย์นิเทศ',
    'นักศึกษา',
    'เจ้าหน้าที่สหกิจ',
    'อาจารย์ผู้ประสานงานสหกิจ'
  ));

commit;
