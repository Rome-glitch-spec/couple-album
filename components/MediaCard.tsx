'use client';

import { Heart, PlayCircle } from 'lucide-react';
import SignedImage from './SignedImage';
import type { Media } from '@/types/database';
import { cn } from '@/lib/utils';

export default function MediaCard({
  media,
  onOpen,
  selected,
  selectable,
  onToggleSelect,
}: {
  media: Media;
  onOpen: () => void;
  selected?: boolean;
  selectable?: boolean;
  onToggleSelect?: () => void;
}) {
  const thumbPath = media.thumbnail_path || media.storage_path;

  return (
    <button
      type="button"
      onClick={() => (selectable ? onToggleSelect?.() : onOpen())}
      onDoubleClick={() => selectable && onOpen()}
      className={cn(
        'group relative aspect-square w-full overflow-hidden rounded-2xl border bg-line/30 focus:outline-none focus:ring-2 focus:ring-wine/50',
        selected ? 'border-wine ring-2 ring-wine/40' : 'border-line'
      )}
      aria-label={media.caption || media.file_name}
    >
      {media.media_type === 'video' ? (
        <div className="relative h-full w-full flex items-center justify-center bg-ink/80">
          <PlayCircle className="h-8 w-8 text-white/90" />
        </div>
      ) : (
        <SignedImage
          path={thumbPath}
          alt={media.caption || media.file_name}
          className="h-full w-full"
          imgClassName="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      )}

      {media.is_favorite && (
        <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
          <Heart className="h-3.5 w-3.5 text-white" fill="white" strokeWidth={0} />
        </div>
      )}

      {selectable && (
        <div
          className={cn(
            'absolute top-2 left-2 h-5 w-5 rounded-full border-2 border-white',
            selected ? 'bg-wine' : 'bg-black/30'
          )}
        />
      )}

      {media.caption && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2.5 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-[11px] text-white truncate">{media.caption}</p>
        </div>
      )}
    </button>
  );
}
