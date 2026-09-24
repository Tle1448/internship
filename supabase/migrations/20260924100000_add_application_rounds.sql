begin;
create table if not exists public.application_rounds (
  id uuid primary key default gen_random_uuid(),
  round_name text not null,
  academic_term text not null,
  criteria_standard text not null default 'เกณฑ์ C6',
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'draft' check (status in ('draft', 'open', 'closed', 'extended')),
  details text not null default '',
  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (start_at < end_at)
);
create unique index if not exists application_rounds_one_current_idx on public.application_rounds (is_current) where is_current;
alter table public.application_rounds enable row level security;
create policy application_rounds_select on public.application_rounds for select to authenticated using (true);
create policy application_rounds_insert on public.application_rounds for insert to authenticated with check ((select public.is_admin()));
create policy application_rounds_update on public.application_rounds for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy application_rounds_delete on public.application_rounds for delete to authenticated using ((select public.is_admin()));
create or replace function public.set_application_rounds_updated_at() returns trigger language plpgsql security invoker set search_path = '' as $$ begin new.updated_at = now(); return new; end; $$;
create trigger application_rounds_updated_at before update on public.application_rounds for each row execute function public.set_application_rounds_updated_at();
insert into public.application_rounds (round_name, academic_term, criteria_standard, start_at, end_at, status, details)
select 'รอบปกติ', 'ภาคการศึกษา 2/2569', 'เกณฑ์ C6', timestamptz '2026-11-01 00:00:00+07', timestamptz '2026-11-30 23:59:00+07', 'open', 'เปิดรับสมัครฝึกงานสำหรับนักศึกษาตามเกณฑ์ C6'
where not exists (select 1 from public.application_rounds where is_current);
commit;
