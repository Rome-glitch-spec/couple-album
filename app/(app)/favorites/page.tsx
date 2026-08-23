import { createClient } from '@/lib/supabase/server';
import PageHeader from '@/components/PageHeader';
import GalleryView from '@/components/GalleryView';
import EmptyState from '@/components/EmptyState';
import { Heart } from 'lucide-react';

export default async function FavoritesPage() {
  const supabase = await createClient();
  const [{ data: items }, { data: albums }, { data: collections }] = await Promise.all([
    supabase.from('media').select('*').eq('is_favorite', true).eq('is_deleted', false).order('taken_at', { ascending: false }),
    supabase.from('albums').select('*').eq('is_archived', false),
    supabase.from('collections').select('*').eq('is_archived', false),
  ]);

  return (
    <div>
      <PageHeader title="Favorites" subtitle="Shared between the two of you — favorite from either side, see it here." />
      <div className="px-4 sm:px-8 py-6">
        {items && items.length > 0 ? (
          <GalleryView initialItems={items} albums={albums ?? []} collections={collections ?? []} removeWhen="favorite" />
        ) : (
          <EmptyState icon={Heart} title="No favorites yet" subtitle="Save the moments you never want to forget." />
        )}
      </div>
    </div>
  );
}
