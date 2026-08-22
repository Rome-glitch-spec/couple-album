import { createClient } from '@/lib/supabase/server';
import PageHeader from '@/components/PageHeader';
import CollectionListView from '@/components/CollectionListView';

export default async function AlbumsPage() {
  const supabase = await createClient();
  const { data: albums } = await supabase.from('albums').select('*').eq('is_archived', false).order('created_at', { ascending: false });

  const items = await Promise.all(
    (albums ?? []).map(async (a) => {
      const { count } = await supabase.from('album_media').select('*', { count: 'exact', head: true }).eq('album_id', a.id);
      let cover = null;
      if (a.cover_media_id) {
        const { data } = await supabase.from('media').select('*').eq('id', a.cover_media_id).single();
        cover = data;
      } else {
        const { data: firstLink } = await supabase.from('album_media').select('media_id').eq('album_id', a.id).limit(1).maybeSingle();
        if (firstLink) {
          const { data } = await supabase.from('media').select('*').eq('id', firstLink.media_id).single();
          cover = data;
        }
      }
      return { ...a, cover, count: count ?? 0 };
    })
  );

  return (
    <div>
      <PageHeader title="Albums" subtitle="Our first date, beach trips, birthdays — organized your way." showAdd={false} />
      <div className="py-4">
        <CollectionListView kind="album" items={items} basePath="/albums" />
      </div>
    </div>
  );
}
