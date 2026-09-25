create index if not exists progress_periods_created_by_idx
  on public.progress_periods (created_by);

create index if not exists progress_reports_reviewed_by_idx
  on public.progress_reports (reviewed_by)
  where reviewed_by is not null;
