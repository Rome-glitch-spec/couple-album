'use client';

import { useState } from 'react';
import { X, FolderHeart, Layers, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Album, Collection, Media } from '@/types/database';

export default function AddToAlbumSheet({
  media,
  albums,
  collections,
  onClose,
}: {
  media: Media;
  albums: Album[];
  collections: Collection[];
  onClose: () => void;
}) {
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<'albums' | 'collections'>('albums');

  async function addTo(kind: 'album' | 'collection', id: string) {
    const supabase = createClient();
    if (kind === 'album') {
      await supabase.from('album_media').upsert({ album_id: id, media_id: media.id });
    } else {
      await supabase.from('collection_media').upsert({ collection_id: id, media_id: media.id });
    }
    setAdded((s) => new Set(s).add(id));
  }

  const list = tab === 'albums' ? albums : collections;

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-end justify-center" onClick={onClose}>
      <div className="w-full sm:max-w-md bg-paper-raised rounded-t-3xl max-h-[75dvh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h3 className="font-display italic text-lg text-ink">Add to…</h3>
          <button onClick={onClose} aria-label="Close"><X className="h-4 w-4 text-ink-soft" /></button>
        </div>
        <div className="flex gap-2 px-5 pt-3">
          <button
            onClick={() => setTab('albums')}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${tab === 'albums' ? 'bg-wine text-white' : 'bg-line/40 text-ink-soft'}`}
          >
            <FolderHeart className="h-3.5 w-3.5" /> Albums
          </button>
          <button
            onClick={() => setTab('collections')}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${tab === 'collections' ? 'bg-wine text-white' : 'bg-line/40 text-ink-soft'}`}
          >
            <Layers className="h-3.5 w-3.5" /> Collections
          </button>
        </div>
        <div className="overflow-y-auto p-5 space-y-2">
          {list.length === 0 && <p className="text-sm text-ink-soft text-center py-6">None yet — create one first.</p>}
          {list.map((item) => (
            <button
              key={item.id}
              onClick={() => addTo(tab === 'albums' ? 'album' : 'collection', item.id)}
              className="w-full flex items-center justify-between rounded-xl border border-line px-4 py-3 text-sm text-ink hover:border-wine/40"
            >
              {item.name}
              {added.has(item.id) && <Check className="h-4 w-4 text-sage" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
