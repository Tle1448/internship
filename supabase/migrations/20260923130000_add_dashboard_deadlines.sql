begin;

create table if not exists public.dashboard_deadlines (
  id uuid primary key default gen_random_uuid(),
  audience text not null check (audience in ('นักศึกษา', 'อาจารย์', 'ผู้ประสานงาน')),
  title text not null check (char_length(btrim(title)) > 0),
  summary text not null default '',
  detail text not null default '',
  due_date date not null,
  destination text not null default '/admin/dashboard',
  color text not null default 'violet' check (color in ('violet', 'orange', 'deep-orange')),
  sort_order integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.dashboard_deadlines enable row level security;

create policy dashboard_deadlines_select on public.dashboard_deadlines
  for select to authenticated using (true);
create policy dashboard_deadlines_insert on public.dashboard_deadlines
  for insert to authenticated with check ((select public.is_admin()));
create policy dashboard_deadlines_update on public.dashboard_deadlines
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy dashboard_deadlines_delete on public.dashboard_deadlines
  for delete to authenticated using ((select public.is_admin()));

create or replace function public.set_dashboard_deadlines_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists dashboard_deadlines_updated_at on public.dashboard_deadlines;
create trigger dashboard_deadlines_updated_at before update on public.dashboard_deadlines
for each row execute function public.set_dashboard_deadlines_updated_at();

insert into public.dashboard_deadlines (audience, title, summary, detail, due_date, destination, color, sort_order)
select * from (values
  ('นักศึกษา', 'ปิดรับสมัครตำแหน่งงาน', 'นักศึกษาต้องส่งใบสมัครให้ครบก่อนวันปิดรับ', 'ตรวจสอบใบสมัครและเอกสารประกอบให้ครบถ้วนก่อนส่งสมัครตำแหน่งงานที่สนใจ', date '2026-11-30', '/admin/jobs', 'deep-orange', 1),
  ('อาจารย์', 'ตรวจเอกสารตอบรับ', 'ตรวจสอบเอกสารที่นักศึกษาส่งเพื่อยืนยันการฝึกงาน', 'ทบทวนหนังสือตอบรับและเอกสารที่เกี่ยวข้อง เพื่อยืนยันสถานะการฝึกงานของนักศึกษา', date '2026-12-05', '/admin/documents', 'orange', 2),
  ('ผู้ประสานงาน', 'ประกาศผลการจัดสรรที่ฝึกงาน', 'เผยแพร่ผลและแจ้งขั้นตอนถัดไปแก่ผู้เกี่ยวข้อง', 'สรุปผลการจัดสรรที่ฝึกงาน แจ้งนักศึกษา อาจารย์ และสถานประกอบการตามรอบที่กำหนด', date '2026-12-15', '/admin/student', 'violet', 3)
) as seed(audience, title, summary, detail, due_date, destination, color, sort_order)
where not exists (select 1 from public.dashboard_deadlines);

commit;
