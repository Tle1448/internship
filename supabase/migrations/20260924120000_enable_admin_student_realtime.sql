-- Allow connected admin screens to receive changes to existing internship data.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'internship_records'
  ) then
    alter publication supabase_realtime add table public.internship_records;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'student_documents'
  ) then
    alter publication supabase_realtime add table public.student_documents;
  end if;
end $$;
