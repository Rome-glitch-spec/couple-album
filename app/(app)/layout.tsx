import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AppShell from '@/components/AppShell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profiles } = await supabase.from('profiles').select('*').order('created_at');
  const profile = profiles?.find((p) => p.id === user.id) ?? null;

  // A signed-in user with no profiles row is not one of the two authorized
  // partners — defense in depth alongside the middleware + RLS checks.
  if (!profile) redirect('/login?error=unauthorized');

  const partner = profiles?.find((p) => p.id !== user.id) ?? null;

  const { data: albums } = await supabase.from('albums').select('*').eq('is_archived', false).order('created_at', { ascending: false });
  const { data: collections } = await supabase.from('collections').select('*').eq('is_archived', false).order('created_at', { ascending: false });

  return (
    <AppShell profile={profile} partner={partner} albums={albums ?? []} collections={collections ?? []}>
      {children}
    </AppShell>
  );
}
