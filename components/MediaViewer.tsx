'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  X, Heart, Download, Trash2, ChevronLeft, ChevronRight,
  ZoomIn, ZoomOut, Maximize2, Archive, FolderPlus, Pencil,
} from 'lucide-react';
import type { Media } from '@/types/database';
import { getDisplayUrl, toggleFavorite, moveToTrash, setArchived, updateCaption } from '@/lib/media-service';
import { formatDate, cn } from '@/lib/utils';

export default function MediaViewer({
  items,
  index,
  onClose,
  onIndexChange,
  onChanged,
  onRequestAddToAlbum,
}: {
  items: Media[];
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
  onChanged?: (updated: Media) => void;
  onRequestAddToAlbum?: (media: Media) => void;
}) {
  const media = items[index];
  const [url, setUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [editingCaption, setEditingCaption] = useState(false);
  const [captionDraft, setCaptionDraft] = useState(media?.caption || '');
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; dragging: boolean }>({ startX: 0, startY: 0, dragging: false });
  const touchRef = useRef<{ startX: number; pinchDist: number | null }>({ startX: 0, pinchDist: null });

  useEffect(() => {
    setZoom(1);
    setPos({ x: 0, y: 0 });
    setCaptionDraft(media?.caption || '');
    setEditingCaption(false);
    if (media) getDisplayUrl(media.storage_path).then(setUrl).catch(() => setUrl(null));
  }, [media]);

  const close = useCallback(() => onClose(), [onClose]);
  const prev = useCallback(() => index > 0 && onIndexChange(index - 1), [index, onIndexChange]);
  const next = useCallback(() => index < items.length - 1 && onIndexChange(index + 1), [index, items.length, onIndexChange]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close, prev, next]);

  if (!media) return null;

  async function handleFavorite() {
    await toggleFavorite(media);
    onChanged?.({ ...media, is_favorite: !media.is_favorite });
  }
  async function handleDelete() {
    if (!confirm('Move this memory to Trash?')) return;
    await moveToTrash(media.id);
    onChanged?.({ ...media, is_deleted: true, deleted_at: new Date().toISOString() });
    close();
  }
  async function handleArchive() {
    await setArchived(media.id, !media.is_archived);
    onChanged?.({ ...media, is_archived: !media.is_archived });
  }
  async function handleDownload() {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = media.file_name;
    a.click();
  }
  async function saveCaption() {
    await updateCaption(media.id, captionDraft);
    onChanged?.({ ...media, caption: captionDraft });
    setEditingCaption(false);
  }
  function toggleFullscreen() {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen?.();
    else document.exitFullscreen?.();
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    setZoom((z) => Math.min(4, Math.max(1, z - e.deltaY * 0.0015)));
  }
  function onDoubleClick() {
    setZoom((z) => (z > 1 ? 1 : 2));
    setPos({ x: 0, y: 0 });
  }
  function onMouseDown(e: React.MouseEvent) {
    if (zoom === 1) return;
    dragRef.current = { startX: e.clientX - pos.x, startY: e.clientY - pos.y, dragging: true };
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragRef.current.dragging) return;
    setPos({ x: e.clientX - dragRef.current.startX, y: e.clientY - dragRef.current.startY });
  }
  function onMouseUp() {
    dragRef.current.dragging = false;
  }

  function dist(t: React.TouchList) {
    const [a, b] = [t[0], t[1]];
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  }
  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      touchRef.current.pinchDist = dist(e.touches);
    } else if (e.touches.length === 1) {
      touchRef.current.startX = e.touches[0].clientX;
    }
  }
  function onTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2 && touchRef.current.pinchDist) {
      const newDist = dist(e.touches);
      const delta = newDist - touchRef.current.pinchDist;
      setZoom((z) => Math.min(4, Math.max(1, z + delta * 0.01)));
      touchRef.current.pinchDist = newDist;
    }
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (zoom === 1 && e.changedTouches.length === 1) {
      const dx = e.changedTouches[0].clientX - touchRef.current.startX;
      if (dx > 60) prev();
      if (dx < -60) next();
    }
    touchRef.current.pinchDist = null;
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black/95 flex flex-col overflow-hidden"
      role="dialog"
      aria-modal="true"
    >
      {/* header */}
      <div className="flex items-center justify-between px-3 sm:px-5 py-3 text-white shrink-0 z-10">
        <div className="min-w-0 pr-2">
          <p className="text-sm font-medium truncate">{formatDate(media.taken_at)}</p>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <IconBtn label="Favorite" onClick={handleFavorite}>
            <Heart className={cn('h-5 w-5', media.is_favorite && 'fill-wine text-wine')} />
          </IconBtn>
          <IconBtn label="Add to album" onClick={() => onRequestAddToAlbum?.(media)}>
            <FolderPlus className="h-5 w-5" />
          </IconBtn>
          <IconBtn label="Archive" onClick={handleArchive}>
            <Archive className={cn('h-5 w-5', media.is_archived && 'text-gold')} />
          </IconBtn>
          <IconBtn label="Download" onClick={handleDownload}>
            <Download className="h-5 w-5" />
          </IconBtn>
          <IconBtn label="Delete" onClick={handleDelete}>
            <Trash2 className="h-5 w-5" />
          </IconBtn>
          <IconBtn label="Fullscreen" onClick={toggleFullscreen}>
            <Maximize2 className="h-5 w-5" />
          </IconBtn>
          <IconBtn label="Close" onClick={close}>
            <X className="h-5 w-5" />
          </IconBtn>
        </div>
      </div>

      {/* body */}
      <div
        className="relative flex-1 flex items-center justify-center select-none touch-none"
        onWheel={media.media_type === 'photo' ? onWheel : undefined}
        onDoubleClick={media.media_type === 'photo' ? onDoubleClick : undefined}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {index > 0 && (
          <button aria-label="Previous" onClick={prev} className="hidden sm:flex absolute left-3 z-10 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 items-center justify-center text-white">
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        {index < items.length - 1 && (
          <button aria-label="Next" onClick={next} className="hidden sm:flex absolute right-3 z-10 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 items-center justify-center text-white">
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        {!url && <div className="h-10 w-10 rounded-full border-2 border-white/30 border-t-white animate-spin" />}

        {url && media.media_type === 'photo' && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={media.caption || media.file_name}
            onError={async () => {
              try {
                setUrl(await getDisplayUrl(media.storage_path, true));
              } catch {
                setUrl(null);
              }
            }}
            className="max-h-full max-w-full object-contain cursor-grab active:cursor-grabbing"
            style={{ transform: `translate(${pos.x}px, ${pos.y}px) scale(${zoom})`, transition: dragRef.current.dragging ? 'none' : 'transform 0.15s ease-out' }}
            draggable={false}
          />
        )}

        {url && media.media_type === 'video' && (
          <video src={url} controls playsInline className="max-h-full max-w-full" />
        )}
      </div>

      {/* footer */}
      <div className="shrink-0 px-4 sm:px-6 py-3 z-10">
        {media.media_type === 'photo' && (
          <div className="flex items-center justify-center gap-2 mb-2">
            <IconBtn label="Zoom out" onClick={() => setZoom((z) => Math.max(1, z - 0.5))}><ZoomOut className="h-4 w-4" /></IconBtn>
            <span className="text-xs text-white/70 w-10 text-center">{Math.round(zoom * 100)}%</span>
            <IconBtn label="Zoom in" onClick={() => setZoom((z) => Math.min(4, z + 0.5))}><ZoomIn className="h-4 w-4" /></IconBtn>
          </div>
        )}
        <div className="max-w-xl mx-auto flex items-center gap-2 justify-center">
          {editingCaption ? (
            <div className="flex items-center gap-2 w-full">
              <input
                autoFocus
                value={captionDraft}
                onChange={(e) => setCaptionDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveCaption()}
                className="flex-1 rounded-lg bg-white/10 text-white placeholder:text-white/40 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/40"
                placeholder="Add a caption…"
              />
              <button onClick={saveCaption} className="text-xs text-white bg-wine px-3 py-1.5 rounded-lg">Save</button>
            </div>
          ) : (
            <button onClick={() => setEditingCaption(true)} className="flex items-center gap-2 text-white/80 text-sm hover:text-white">
              <Pencil className="h-3.5 w-3.5" />
              {media.caption || 'Add a caption…'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function IconBtn({ children, onClick, label }: { children: React.ReactNode; onClick?: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="h-9 w-9 rounded-full flex items-center justify-center text-white/90 hover:bg-white/10 hover:text-white transition-colors"
    >
      {children}
    </button>
  );
}
