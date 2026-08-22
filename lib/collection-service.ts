'use client';

import { createClient } from '@/lib/supabase/client';

export async function createAlbum(name: string, description?: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');
  const { data, error } = await supabase
    .from('albums')
    .insert({ name, description: description || null, created_by: user.id })
    .select()
    .single();
  if (error) throw new Error('Could not create album.');
  return data;
}

export async function renameAlbum(id: string, name: string, description?: string) {
  const supabase = createClient();
  const { error } = await supabase.from('albums').update({ name, description }).eq('id', id);
  if (error) throw new Error('Could not update album.');
}

export async function deleteAlbum(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('albums').delete().eq('id', id);
  if (error) throw new Error('Could not delete album.');
}

export async function setAlbumArchived(id: string, archived: boolean) {
  const supabase = createClient();
  const { error } = await supabase.from('albums').update({ is_archived: archived }).eq('id', id);
  if (error) throw new Error('Could not update album.');
}

export async function removeFromAlbum(albumId: string, mediaId: string) {
  const supabase = createClient();
  const { error } = await supabase.from('album_media').delete().eq('album_id', albumId).eq('media_id', mediaId);
  if (error) throw new Error('Could not remove from album.');
}

export async function createCollection(name: string, description?: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');
  const { data, error } = await supabase
    .from('collections')
    .insert({ name, description: description || null, created_by: user.id })
    .select()
    .single();
  if (error) throw new Error('Could not create collection.');
  return data;
}

export async function renameCollection(id: string, name: string, description?: string) {
  const supabase = createClient();
  const { error } = await supabase.from('collections').update({ name, description }).eq('id', id);
  if (error) throw new Error('Could not update collection.');
}

export async function deleteCollection(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('collections').delete().eq('id', id);
  if (error) throw new Error('Could not delete collection.');
}

export async function setCollectionArchived(id: string, archived: boolean) {
  const supabase = createClient();
  const { error } = await supabase.from('collections').update({ is_archived: archived }).eq('id', id);
  if (error) throw new Error('Could not update collection.');
}

export async function removeFromCollection(collectionId: string, mediaId: string) {
  const supabase = createClient();
  const { error } = await supabase.from('collection_media').delete().eq('collection_id', collectionId).eq('media_id', mediaId);
  if (error) throw new Error('Could not remove from collection.');
}
