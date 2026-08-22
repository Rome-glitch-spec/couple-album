'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MediaGrid from './MediaGrid';
import MediaViewer from './MediaViewer';
import AddToAlbumSheet from './AddToAlbumSheet';
import type { Album, Collection, Media } from '@/types/database';

export default function GalleryView({
  initialItems,
  groupByMonth = false,
  albums = [],
  collections = [],
  removeWhen,
}: {
  initialItems: Media[];
  groupByMonth?: boolean;
  albums?: Album[];
  collections?: Collection[];
  /** if provided, an item is removed from this view once it no longer satisfies this predicate */
  removeWhen?: (m: Media) => boolean;
}) {
  const [items, setItems] = useState(initialItems);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [viewerList, setViewerList] = useState<Media[]>(initialItems);
  const [addToAlbumMedia, setAddToAlbumMedia] = useState<Media | null>(null);
  const router = useRouter();

  function handleOpen(index: number, list: Media[]) {
    setViewerList(list);
    setViewerIndex(index);
  }

  function handleChanged(updated: Media) {
    setItems((prev) => {
      const shouldRemove = removeWhen?.(updated);
      const next = shouldRemove ? prev.filter((m) => m.id !== updated.id) : prev.map((m) => (m.id === updated.id ? updated : m));
      return next;
    });
    setViewerList((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    router.refresh();
  }

  return (
    <>
      <MediaGrid items={items} groupByMonth={groupByMonth} onOpen={handleOpen} />

      {viewerIndex !== null && viewerList[viewerIndex] && (
        <MediaViewer
          items={viewerList}
          index={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onIndexChange={setViewerIndex}
          onChanged={handleChanged}
          onRequestAddToAlbum={(m) => setAddToAlbumMedia(m)}
        />
      )}

      {addToAlbumMedia && (
        <AddToAlbumSheet
          media={addToAlbumMedia}
          albums={albums}
          collections={collections}
          onClose={() => setAddToAlbumMedia(null)}
        />
      )}
    </>
  );
}
