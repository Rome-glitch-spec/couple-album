'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getSignedUrl } from '@/lib/media-service';
import PageHeader from '@/components/PageHeader';
import SignedImage from '@/components/SignedImage';
import EmptyState from '@/components/EmptyState';
import { Wand2, Check, Download, Save, X } from 'lucide-react';
import type { Media } from '@/types/database';
import { cn } from '@/lib/utils';

type LayoutKey = 'grid2' | 'grid3' | 'grid4' | 'grid6' | 'vertical' | 'horizontal' | 'polaroid';

const LAYOUTS: { key: LayoutKey; label: string; slots: number; template: string }[] = [
  { key: 'grid2', label: '2 Photos', slots: 2, template: 'grid-cols-2 grid-rows-1' },
  { key: 'grid3', label: '3 Photos', slots: 3, template: 'grid-cols-2 grid-rows-2 [&>*:first-child]:row-span-2' },
  { key: 'grid4', label: '4 Grid', slots: 4, template: 'grid-cols-2 grid-rows-2' },
  { key: 'grid6', label: '6 Grid', slots: 6, template: 'grid-cols-3 grid-rows-2' },
  { key: 'vertical', label: 'Vertical', slots: 3, template: 'grid-cols-1 grid-rows-3' },
  { key: 'horizontal', label: 'Horizontal', slots: 3, template: 'grid-cols-3 grid-rows-1' },
  { key: 'polaroid', label: 'Polaroid', slots: 4, template: 'grid-cols-2 grid-rows-2' },
];

export default function CollagePage() {
  const [library, setLibrary] = useState<Media[]>([]);
  const [layout, setLayout] = useState<LayoutKey>('grid4');
  const [slots, setSlots] = useState<(Media | null)[]>(Array(4).fill(null));
  const [border, setBorder] = useState(6);
  const [spacing, setSpacing] = useState(6);
  const [caption, setCaption] = useState('');
  const [pickerSlot, setPickerSlot] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const activeLayout = LAYOUTS.find((l) => l.key === layout)!;

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('media')
      .select('*')
      .eq('media_type', 'photo')
      .eq('is_deleted', false)
      .order('taken_at', { ascending: false })
      .then(({ data }) => setLibrary(data ?? []));
  }, []);

  useEffect(() => {
    setSlots((prev) => {
      const next = Array(activeLayout.slots).fill(null);
      for (let i = 0; i < Math.min(prev.length, next.length); i++) next[i] = prev[i];
      return next;
    });
  }, [layout, activeLayout.slots]);

  function assignSlot(media: Media) {
    if (pickerSlot === null) return;
    setSlots((prev) => prev.map((s, i) => (i === pickerSlot ? media : s)));
    setPickerSlot(null);
  }

  async function renderCollage(): Promise<Blob | null> {
    const size = 1080;
    const canvas = canvasRef.current;
    if (!canvas) return null;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#faf5ee';
    ctx.fillRect(0, 0, size, size);

    const cols = layout === 'vertical' ? 1 : layout === 'horizontal' ? activeLayout.slots : layout === 'grid2' ? 2 : layout === 'grid6' ? 3 : 2;
    const rows = Math.ceil(activeLayout.slots / cols);
    const cellW = (size - spacing * (cols + 1)) / cols;
    const cellH = (size - spacing * (rows + 1)) / rows;

    for (let i = 0; i < slots.length; i++) {
      const media = slots[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = spacing + col * (cellW + spacing);
      const y = spacing + row * (cellH + spacing);

      ctx.fillStyle = '#e7dccb';
      ctx.fillRect(x, y, cellW, cellH);

      if (media) {
        try {
          const url = await getSignedUrl(media.storage_path);
          const img = await loadImage(url);
          drawCover(ctx, img, x + border, y + border, cellW - border * 2, cellH - border * 2);
        } catch {
          /* leave placeholder */
        }
      }
    }

    if (caption) {
      ctx.fillStyle = '#2a2019';
      ctx.font = 'italic 40px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(caption, size / 2, size - 24);
    }

    return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const blob = await renderCollage();
      if (!blob) throw new Error('Could not render collage.');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in.');

      const id = crypto.randomUUID();
      const now = new Date();
      const path = `collages/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${id}.jpg`;
      const { error: upErr } = await supabase.storage.from('couple-media').upload(path, blob, { contentType: 'image/jpeg' });
      if (upErr) throw new Error(upErr.message);

      const { data: mediaRow, error: insErr } = await supabase
        .from('media')
        .insert({
          owner_id: user.id,
          storage_path: path,
          file_name: `collage-${id}.jpg`,
          media_type: 'collage',
          mime_type: 'image/jpeg',
          file_size: blob.size,
          caption: caption || null,
          taken_at: now.toISOString(),
        })
        .select()
        .single();
      if (insErr) throw new Error(insErr.message);

      await supabase.from('collages').insert({
        created_by: user.id,
        media_id: mediaRow.id,
        layout,
        metadata: { slot_media_ids: slots.map((s) => s?.id ?? null), border, spacing },
      });

      const url = await getSignedUrl(path);
      setSavedUrl(url);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Could not save collage.');
    } finally {
      setSaving(false);
    }
  }

  const filledCount = slots.filter(Boolean).length;

  return (
    <div>
      <PageHeader title="Collage Maker" subtitle="Turn a handful of memories into one keepsake." showAdd={false} />

      <div className="px-4 sm:px-8 py-6 grid lg:grid-cols-[1fr_320px] gap-6">
        <div>
          <div className="flex flex-wrap gap-2 mb-4">
            {LAYOUTS.map((l) => (
              <button
                key={l.key}
                onClick={() => setLayout(l.key)}
                className={cn('text-xs font-medium rounded-full px-3 py-1.5', layout === l.key ? 'bg-wine text-white' : 'bg-line/40 text-ink-soft')}
              >
                {l.label}
              </button>
            ))}
          </div>

          <div className={cn('grid aspect-square w-full max-w-xl rounded-2xl overflow-hidden border border-line bg-line/20', activeLayout.template)} style={{ gap: spacing / 2 }}>
            {slots.map((media, i) => (
              <button
                key={i}
                onClick={() => setPickerSlot(i)}
                className="relative bg-line/40 hover:bg-line/60 transition-colors overflow-hidden"
                style={{ padding: border / 2 }}
              >
                {media ? (
                  <SignedImage path={media.thumbnail_path || media.storage_path} alt="" className="h-full w-full" imgClassName="h-full w-full object-cover" />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-ink-soft text-xs">Tap to choose</span>
                )}
              </button>
            ))}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {savedUrl && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-sage/40 bg-sage/10 px-4 py-3">
              <Check className="h-4 w-4 text-sage shrink-0" />
              <p className="text-sm text-ink flex-1">Collage saved to your memories.</p>
              <a href={savedUrl} download="collage.jpg" className="text-xs font-medium text-wine flex items-center gap-1"><Download className="h-3.5 w-3.5" /> Download</a>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-xs font-medium text-ink-soft mb-1 block">Caption / date</label>
            <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Our summer, 2026" className="w-full rounded-xl border border-line bg-paper-raised px-3.5 py-2 text-sm text-ink" />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-soft mb-1 block">Border ({border}px)</label>
            <input type="range" min={0} max={24} value={border} onChange={(e) => setBorder(Number(e.target.value))} className="w-full accent-wine" />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-soft mb-1 block">Spacing ({spacing}px)</label>
            <input type="range" min={0} max={24} value={spacing} onChange={(e) => setSpacing(Number(e.target.value))} className="w-full accent-wine" />
          </div>
          <button
            onClick={handleSave}
            disabled={filledCount === 0 || saving}
            className="w-full rounded-xl bg-wine text-white font-medium py-2.5 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save collage'}
          </button>
          <p className="text-xs text-ink-soft">{filledCount} of {activeLayout.slots} slots filled</p>
        </div>
      </div>

      {pickerSlot !== null && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center" onClick={() => setPickerSlot(null)}>
          <div className="w-full sm:max-w-lg max-h-[80dvh] bg-paper-raised rounded-t-3xl sm:rounded-3xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <h3 className="font-display italic text-lg text-ink">Choose a photo</h3>
              <button onClick={() => setPickerSlot(null)} aria-label="Close"><X className="h-4 w-4 text-ink-soft" /></button>
            </div>
            <div className="overflow-y-auto p-4">
              {library.length === 0 ? (
                <EmptyState icon={Wand2} title="No photos yet" subtitle="Add some memories first." />
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {library.map((m) => (
                    <button key={m.id} onClick={() => assignSlot(m)} className="aspect-square rounded-xl overflow-hidden border border-line">
                      <SignedImage path={m.thumbnail_path || m.storage_path} alt="" className="h-full w-full" imgClassName="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const imgRatio = img.width / img.height;
  const boxRatio = w / h;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  if (imgRatio > boxRatio) {
    sw = img.height * boxRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / boxRatio;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}
