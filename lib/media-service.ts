'use client';

import heic2any from 'heic2any';
import { createClient } from '@/lib/supabase/client';
import type { Media } from '@/types/database';
import { validateFile } from '@/lib/utils';

const BUCKET = 'couple-media';

export interface UploadOptions {
  caption?: string;
  takenAt?: string;
  albumId?: string;
  collectionId?: string;
  isFavorite?: boolean;
  isArchived?: boolean;
  onProgress?: (pct: number) => void;
}

/**
 * Uploads a single file to the private bucket and inserts its metadata row.
 * Storage path is namespaced by media type + year/month, e.g.
 * photos/2026/08/<uuid>.jpg — RLS on storage.objects (not path parsing)
 * is what actually enforces access.
 */
export async function uploadMedia(file: File, opts: UploadOptions = {}): Promise<Media> {
  const supabase = createClient();
  const validation = validateFile(file);
  if (!validation.ok) throw new Error(validation.reason);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be signed in to upload.');

  const ext = file.name.split('.').pop() || 'bin';
  const id = crypto.randomUUID();
  const now = new Date();
  const folder = validation.type === 'photo' ? 'photos' : 'videos';
  const storagePath = `${folder}/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${id}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  });
  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

  let width: number | null = null;
  let height: number | null = null;
  if (validation.type === 'photo') {
    try {
      const dims = await readImageDimensions(file);
      width = dims.width;
      height = dims.height;
    } catch {
      /* non-fatal */
    }
  }

  const { data: row, error: insertError } = await supabase
    .from('media')
    .insert({
      owner_id: user.id,
      storage_path: storagePath,
      file_name: file.name,
      media_type: validation.type,
      mime_type: file.type,
      file_size: file.size,
      width,
      height,
      caption: opts.caption || null,
      taken_at: opts.takenAt || now.toISOString(),
      is_favorite: opts.isFavorite ?? false,
      is_archived: opts.isArchived ?? false,
    })
    .select()
    .single();

  if (insertError) {
    // best-effort cleanup so we don't leave orphaned storage objects
    await supabase.storage.from(BUCKET).remove([storagePath]);
    throw new Error(`Could not save memory details: ${insertError.message}`);
  }

  if (opts.albumId) {
    await supabase.from('album_media').insert({ album_id: opts.albumId, media_id: row.id });
  }
  if (opts.collectionId) {
    await supabase.from('collection_media').insert({ collection_id: opts.collectionId, media_id: row.id });
  }

  return row as Media;
}

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = reject;
    img.src = url;
  });
}

const urlCache = new Map<string, { url: string; expires: number }>();

/** Signed URL, cached in-memory for its lifetime so galleries don't re-request per render. */
export async function getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
  const cached = urlCache.get(path);
  if (cached && cached.expires > Date.now() + 5000) return cached.url;

  const supabase = createClient();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn);
  if (error || !data) throw new Error('Could not load this file.');
  urlCache.set(path, { url: data.signedUrl, expires: Date.now() + expiresIn * 1000 });
  return data.signedUrl;
}

export async function getDisplayUrl(path: string, forceConversion = false): Promise<string> {
  const signedUrl = await getSignedUrl(path);
  if (!forceConversion && !/\.(heic|heif)(?:$|\?)/i.test(path)) return signedUrl;

  const response = await fetch(signedUrl);
  if (!response.ok) throw new Error('Could not load this file.');
  const converted = await heic2any({ blob: await response.blob(), toType: 'image/jpeg', quality: 0.92 });
  const blob = Array.isArray(converted) ? converted[0] : converted;
  return URL.createObjectURL(blob);
}

export async function toggleFavorite(media: Media) {
  const supabase = createClient();
  const { error } = await supabase.from('media').update({ is_favorite: !media.is_favorite }).eq('id', media.id);
  if (error) throw new Error('Could not update favorite.');
}

export async function moveToTrash(mediaId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('media')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', mediaId);
  if (error) throw new Error('Could not move to trash.');
}

export async function restoreFromTrash(mediaId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('media')
    .update({ is_deleted: false, deleted_at: null })
    .eq('id', mediaId);
  if (error) throw new Error('Could not restore.');
}

export async function permanentlyDelete(media: Media) {
  const supabase = createClient();
  const { error: storageError } = await supabase.storage.from(BUCKET).remove([media.storage_path]);
  if (storageError) throw new Error('Could not delete the file from storage.');
  const { error } = await supabase.from('media').delete().eq('id', media.id);
  if (error) throw new Error('Could not delete the record.');
}

export async function setArchived(mediaId: string, archived: boolean) {
  const supabase = createClient();
  const { error } = await supabase.from('media').update({ is_archived: archived }).eq('id', mediaId);
  if (error) throw new Error('Could not update archive status.');
}

export async function updateCaption(mediaId: string, caption: string) {
  const supabase = createClient();
  const { error } = await supabase.from('media').update({ caption }).eq('id', mediaId);
  if (error) throw new Error('Could not update caption.');
}
