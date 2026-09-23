begin;

alter table public.dashboard_deadlines
  add column if not exists academic_term text not null default '2/2569';

create index if not exists dashboard_deadlines_academic_term_due_date_idx
  on public.dashboard_deadlines (academic_term, due_date, sort_order);

commit;
