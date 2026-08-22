import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CollectionDetailView from '@/components/CollectionDetailView';

export default async function AlbumDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: album } = await supabase.from('albums').select('*').eq('id', id).single();
  if (!album) notFound();

  const { data: links } = await supabase.from('album_media').select('media_id').eq('album_id', id);
  const mediaIds = (links ?? []).map((l) => l.media_id);

  let media: import("@/types/database").Media[] = [];
  if (mediaIds.length > 0) {
    const { data } = await supabase.from('media').select('*').in('id', mediaIds).eq('is_deleted', false).order('taken_at', { ascending: false });
    media = data ?? [];
  }

  return <CollectionDetailView kind="album" item={album} media={media} backHref="/albums" />;
}
