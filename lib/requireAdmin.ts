import { redirect } from 'next/navigation';
import { getCurrentUser } from './session';
import { supabaseAdmin } from './supabaseAdmin';

export async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'admin';

  if (!isAdmin) {
    redirect('/login');
  }

  return { user, profile };
}