import { redirect } from 'next/navigation';
import { getCurrentUser } from './session';
import { supabaseAdmin } from './supabaseAdmin';

export async function requireAdvisor() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdvisor = profile?.role === 'advisor' || profile?.role === 'admin';

  if (!isAdvisor) {
    redirect('/login');
  }

  return { user, profile };
}