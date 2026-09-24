begin;

alter table public.application_rounds
  add column if not exists target_audience text[] not null default array['นักศึกษา']::text[],
  add column if not exists application_quota integer not null default 0 check (application_quota >= 0);

commit;
