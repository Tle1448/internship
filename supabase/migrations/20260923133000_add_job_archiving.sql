alter table public.jobs
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references public.profiles(id);

create index if not exists jobs_active_listing_idx
  on public.jobs (status, created_at desc)
  where archived_at is null;
