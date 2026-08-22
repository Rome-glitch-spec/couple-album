'use client';

import { useCallback, useRef, useState } from 'react';
import { X, UploadCloud, Film, AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';
import { uploadMedia } from '@/lib/media-service';
import { validateFile, formatBytes, cn } from '@/lib/utils';
import type { Album, Collection, Media } from '@/types/database';

interface QueueItem {
  file: File;
  previewUrl: string;
  caption: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
  progress: number;
}

export default function UploadModal({
  albums,
  collections,
  onClose,
  onUploaded,
}: {
  albums: Album[];
  collections: Collection[];
  onClose: () => void;
  onUploaded: (media: Media[]) => void;
}) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [albumId, setAlbumId] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [favorite, setFavorite] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [prepareError, setPrepareError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    if (files.length === 0) return;
    setPreparing(true);
    setPrepareError(null);
    try {
      const normalizedFiles = await Promise.all(Array.from(files).map(async (file) => {
        if (file.type !== 'image/heic' && file.type !== 'image/heif') return file;

        const { default: heic2any } = await import('heic2any');
        const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
        const blob = Array.isArray(converted) ? converted[0] : converted;
        return new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
          type: 'image/jpeg',
          lastModified: file.lastModified,
        });
      }));
      const items: QueueItem[] = normalizedFiles.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
        caption: '',
        status: 'pending',
        progress: 0,
      }));
      setQueue((q) => [...q, ...items]);
    } catch (e) {
      setPrepareError(e instanceof Error ? e.message : 'Could not prepare the selected files.');
    } finally {
      setPreparing(false);
    }
  }, []);

  function updateItem(idx: number, patch: Partial<QueueItem>) {
    setQueue((q) => q.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  async function uploadOne(idx: number, item: QueueItem) {
    const validation = validateFile(item.file);
    if (!validation.ok) {
      updateItem(idx, { status: 'error', error: validation.reason });
      return null;
    }
    updateItem(idx, { status: 'uploading', progress: 30 });
    try {
      const media = await uploadMedia(item.file, {
        caption: item.caption || undefined,
        albumId: albumId || undefined,
        collectionId: collectionId || undefined,
        isFavorite: favorite,
      });
      updateItem(idx, { status: 'done', progress: 100 });
      return media;
    } catch (e) {
      updateItem(idx, { status: 'error', error: e instanceof Error ? e.message : 'Upload failed' });
      return null;
    }
  }

  async function handleUploadAll() {
    const uploaded: Media[] = [];
    for (let i = 0; i < queue.length; i++) {
      if (queue[i].status === 'done') continue;
      const result = await uploadOne(i, queue[i]);
      if (result) uploaded.push(result);
    }
    if (uploaded.length) onUploaded(uploaded);
  }

  async function retry(idx: number) {
    const result = await uploadOne(idx, queue[idx]);
    if (result) onUploaded([result]);
  }

  const allDone = queue.length > 0 && queue.every((q) => q.status === 'done');
  const anyUploading = queue.some((q) => q.status === 'uploading');

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="w-full sm:max-w-lg max-h-[92dvh] bg-paper-raised rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
          <h2 className="font-display italic text-xl text-ink">Add memories</h2>
          <button onClick={onClose} aria-label="Close" className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-line/50">
            <X className="h-4 w-4 text-ink-soft" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-4 flex-1">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files.length) void addFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className={cn(
              'rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors',
              dragOver ? 'border-wine bg-wine/5' : 'border-line hover:border-wine/40'
            )}
          >
            <UploadCloud className="h-7 w-7 mx-auto text-wine mb-2" />
            <p className="text-sm text-ink">{preparing ? 'Preparing photos…' : 'Drag photos or videos here'}</p>
            <p className="text-xs text-ink-soft mt-1">or tap to choose from your device</p>
            {prepareError && <p className="text-xs text-wine mt-2">{prepareError}</p>}
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime,video/webm"
              className="hidden"
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                const files = e.target.files ? Array.from(e.target.files) : [];
                e.target.value = '';
                void addFiles(files);
              }}
            />
          </div>

          {queue.length > 0 && (
            <div className="space-y-2">
              {queue.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 rounded-xl border border-line p-2">
                  <div className="h-12 w-12 rounded-lg overflow-hidden bg-line/40 flex items-center justify-center shrink-0">
                    {item.file.type.startsWith('image/') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Film className="h-5 w-5 text-ink-soft" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <input
                      value={item.caption}
                      onChange={(e) => updateItem(idx, { caption: e.target.value })}
                      placeholder="Caption (optional)"
                      className="w-full text-sm bg-transparent border-none focus:outline-none placeholder:text-ink-soft/60 text-ink"
                    />
                    <p className="text-[11px] text-ink-soft truncate">{item.file.name} · {formatBytes(item.file.size)}</p>
                    {item.status === 'error' && (
                      <p className="text-[11px] text-wine flex items-center gap-1 mt-0.5"><AlertCircle className="h-3 w-3" />{item.error}</p>
                    )}
                  </div>
                  {item.status === 'uploading' && <div className="h-4 w-4 rounded-full border-2 border-line border-t-wine animate-spin shrink-0" />}
                  {item.status === 'done' && <CheckCircle2 className="h-5 w-5 text-sage shrink-0" />}
                  {item.status === 'error' && (
                    <button onClick={() => retry(idx)} aria-label="Retry" className="shrink-0 h-7 w-7 flex items-center justify-center rounded-full hover:bg-line/50">
                      <RotateCcw className="h-3.5 w-3.5 text-ink-soft" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-ink-soft mb-1 block">Album</label>
              <select value={albumId} onChange={(e) => setAlbumId(e.target.value)} className="w-full rounded-lg border border-line bg-paper px-2.5 py-2 text-sm text-ink">
                <option value="">None</option>
                {albums.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-soft mb-1 block">Collection</label>
              <select value={collectionId} onChange={(e) => setCollectionId(e.target.value)} className="w-full rounded-lg border border-line bg-paper px-2.5 py-2 text-sm text-ink">
                <option value="">None</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={favorite} onChange={(e) => setFavorite(e.target.checked)} className="rounded accent-wine" />
            Mark as favorite
          </label>
        </div>

        <div className="px-5 py-4 border-t border-line shrink-0">
          {allDone ? (
            <button onClick={onClose} className="w-full rounded-xl bg-sage text-white font-medium py-2.5">
              Done — added {queue.length} {queue.length === 1 ? 'memory' : 'memories'}
            </button>
          ) : (
            <button
              onClick={handleUploadAll}
              disabled={queue.length === 0 || anyUploading}
              className="w-full rounded-xl bg-wine text-white font-medium py-2.5 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {anyUploading ? 'Uploading…' : `Upload ${queue.length || ''}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
