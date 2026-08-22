'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
import { getDisplayUrl } from '@/lib/media-service';
import { formatDate } from '@/lib/utils';
import type { Media } from '@/types/database';

const SLIDE_MS = 4500;

export default function Slideshow({ items, title, onClose }: { items: Media[]; title: string; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [url, setUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(Date.now());

  const current = items[index];

  useEffect(() => {
    if (!current) return;
    setUrl(null);
    getDisplayUrl(current.storage_path).then(setUrl).catch(() => setUrl(null));
  }, [current]);

  const next = useCallback(() => setIndex((i) => (i + 1) % items.length), [items.length]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + items.length) % items.length), [items.length]);

  useEffect(() => {
    if (!playing || current?.media_type === 'video') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    startRef.current = Date.now();
    setProgress(0);
    timerRef.current = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - startRef.current) / SLIDE_MS) * 100);
      setProgress(pct);
      if (pct >= 100) next();
    }, 50);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, index, current, next]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === ' ') {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, onClose]);

  if (!current) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 text-white shrink-0">
        <div>
          <p className="font-display italic text-lg">{title}</p>
          <p className="text-xs text-white/60">{formatDate(current.taken_at)}</p>
        </div>
        <button onClick={onClose} aria-label="Exit presentation" className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-white/10">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex gap-1 px-5 shrink-0">
        {items.map((_, i) => (
          <div key={i} className="h-0.5 flex-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-[width]"
              style={{ width: i < index ? '100%' : i === index ? `${progress}%` : '0%', transitionDuration: i === index ? '50ms' : '0ms' }}
            />
          </div>
        ))}
      </div>

      <div className="relative flex-1 flex items-center justify-center">
        <button onClick={prev} aria-label="Previous" className="absolute left-3 z-10 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button onClick={next} aria-label="Next" className="absolute right-3 z-10 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
          <ChevronRight className="h-6 w-6" />
        </button>

        {!url && <div className="h-10 w-10 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
        {url && current.media_type === 'photo' && (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={current.id} src={url} alt={current.caption || ''} className="max-h-full max-w-full object-contain animate-[fadeIn_0.6s_ease]" />
        )}
        {url && current.media_type === 'video' && (
          <video src={url} autoPlay muted={false} playsInline onEnded={next} className="max-h-full max-w-full" />
        )}

        {current.caption && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur px-4 py-2 rounded-full text-white text-sm max-w-md text-center">
            {current.caption}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 py-5 shrink-0">
        <button onClick={prev} aria-label="Previous" className="text-white/70 hover:text-white"><ChevronLeft className="h-5 w-5" /></button>
        <button onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause' : 'Play'} className="h-11 w-11 rounded-full bg-white flex items-center justify-center text-black">
          {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
        </button>
        <button onClick={next} aria-label="Next" className="text-white/70 hover:text-white"><ChevronRight className="h-5 w-5" /></button>
      </div>
    </div>
  );
}
