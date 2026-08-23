import { createClient } from '@/lib/supabase/server';
import PageHeader from '@/components/PageHeader';
import GalleryView from '@/components/GalleryView';
import EmptyState from '@/components/EmptyState';
import { Archive } from 'lucide-react';

export default async function ArchivePage() {
  const supabase = await createClient();
  const [{ data: items }, { data: albums }, { data: collections }] = await Promise.all([
    supabase.from('media').select('*').eq('is_archived', true).eq('is_deleted', false).order('taken_at', { ascending: false }),
    supabase.from('albums').select('*'),
    supabase.from('collections').select('*'),
  ]);

  return (
    <div>
      <PageHeader title="Archived" subtitle="Tucked away, but never lost." showAdd={false} />
      <div className="px-4 sm:px-8 py-6">
        {items && items.length > 0 ? (
          <GalleryView initialItems={items} albums={albums ?? []} collections={collections ?? []} removeWhen="archived" />
        ) : (
          <EmptyState icon={Archive} title="Nothing archived" subtitle="Archived photos and videos will show up here, out of your main gallery but always safe." />
        )}
      </div>
    </div>
  );
}
