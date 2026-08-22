'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw, Trash2 } from 'lucide-react';
import SignedImage from './SignedImage';
import EmptyState from './EmptyState';
import type { Media } from '@/types/database';
import { restoreFromTrash, permanentlyDelete } from '@/lib/media-service';
import { daysRemainingInTrash, formatDate } from '@/lib/utils';

export default function TrashGrid({ initialItems }: { initialItems: Media[] }) {
  const [items, setItems] = useState(initialItems);
  const router = useRouter();

  async function handleRestore(id: string) {
    await restoreFromTrash(id);
    setItems((prev) => prev.filter((m) => m.id !== id));
    router.refresh();
  }

  async function handlePermanentDelete(media: Media) {
    if (!confirm('Permanently delete this memory? This cannot be undone.')) return;
    await permanentlyDelete(media);
    setItems((prev) => prev.filter((m) => m.id !== media.id));
    router.refresh();
  }

  if (items.length === 0) {
    return <EmptyState icon={Trash2} title="Your memories are safe here" subtitle="Anything you delete stays in Trash for 30 days before it's gone for good." />;
  }

  return (
    <div className="space-y-3">
      {items.map((m) => (
        <div key={m.id} className="flex items-center gap-3 rounded-2xl border border-line p-3">
          <div className="h-16 w-16 rounded-xl overflow-hidden shrink-0 bg-line/40">
            <SignedImage path={m.thumbnail_path || m.storage_path} alt={m.file_name} className="h-full w-full" imgClassName="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink truncate">{m.file_name}</p>
            <p className="text-xs text-ink-soft">Deleted {formatDate(m.deleted_at)}</p>
            <p className="text-xs text-gold">{daysRemainingInTrash(m.deleted_at)} days left</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={() => handleRestore(m.id)} aria-label="Restore" className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-line/40 text-sage">
              <RotateCcw className="h-4 w-4" />
            </button>
            <button onClick={() => handlePermanentDelete(m)} aria-label="Delete permanently" className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-line/40 text-wine">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
