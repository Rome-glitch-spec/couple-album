import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CollectionDetailView from '@/components/CollectionDetailView';

export default async function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: collection } = await supabase.from('collections').select('*').eq('id', id).single();
  if (!collection) notFound();

  const { data: links } = await supabase.from('collection_media').select('media_id').eq('collection_id', id);
  const mediaIds = (links ?? []).map((l) => l.media_id);

  let media: import("@/types/database").Media[] = [];
  if (mediaIds.length > 0) {
    const { data } = await supabase.from('media').select('*').in('id', mediaIds).eq('is_deleted', false).order('taken_at', { ascending: false });
    media = data ?? [];
  }

  return <CollectionDetailView kind="collection" item={collection} media={media} backHref="/collections" />;
}
