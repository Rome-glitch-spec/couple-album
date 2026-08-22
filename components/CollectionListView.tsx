'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, X, FolderHeart } from 'lucide-react';
import EmptyState from './EmptyState';
import SignedImage from './SignedImage';
import type { Album, Collection, Media } from '@/types/database';
import { createAlbum, createCollection } from '@/lib/collection-service';

type Item = (Album | Collection) & { cover?: Media | null; count?: number };

export default function CollectionListView({
  kind,
  items,
  basePath,
}: {
  kind: 'album' | 'collection';
  items: Item[];
  basePath: string;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const created = kind === 'album' ? await createAlbum(name, description) : await createCollection(name, description);
      setShowCreate(false);
      setName('');
      setDescription('');
      router.push(`${basePath}/${created.id}`);
      router.refresh();
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-end px-4 sm:px-8 -mt-2 mb-4">
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 text-sm font-medium text-wine hover:underline">
          <Plus className="h-4 w-4" /> New {kind}
        </button>
      </div>

      <div className="px-4 sm:px-8">
        {items.length === 0 ? (
          <EmptyState
            icon={FolderHeart}
            title={kind === 'album' ? 'Create your first album' : 'Create your first collection'}
            subtitle={kind === 'album' ? 'Group memories from a trip, birthday, or moment worth keeping together.' : 'Group memories by theme instead of by event.'}
            action={
              <button onClick={() => setShowCreate(true)} className="rounded-full bg-wine text-white text-sm font-medium px-4 py-2">
                Create {kind}
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => (
              <Link key={item.id} href={`${basePath}/${item.id}`} className="group rounded-2xl overflow-hidden border border-line hover:border-wine/40 transition-colors">
                <div className="aspect-[4/3] bg-line/40">
                  {item.cover ? (
                    <SignedImage path={item.cover.thumbnail_path || item.cover.storage_path} alt={item.name} className="h-full w-full" imgClassName="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-ink-soft">
                      <FolderHeart className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-ink truncate">{item.name}</p>
                  <p className="text-xs text-ink-soft">{item.count ?? 0} {item.count === 1 ? 'memory' : 'memories'}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center" onClick={() => setShowCreate(false)}>
          <div className="w-full sm:max-w-sm bg-paper-raised rounded-t-3xl sm:rounded-3xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display italic text-lg text-ink">New {kind}</h3>
              <button onClick={() => setShowCreate(false)} aria-label="Close"><X className="h-4 w-4 text-ink-soft" /></button>
            </div>
            <label className="text-xs font-medium text-ink-soft mb-1 block">Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={kind === 'album' ? 'Beach Trip' : 'Sunset Collection'}
              className="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm text-ink mb-3 focus:outline-none focus:ring-2 focus:ring-wine/30"
            />
            <label className="text-xs font-medium text-ink-soft mb-1 block">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm text-ink mb-4 focus:outline-none focus:ring-2 focus:ring-wine/30"
            />
            <button onClick={handleCreate} disabled={creating || !name.trim()} className="w-full rounded-xl bg-wine text-white font-medium py-2.5 disabled:opacity-50">
              {creating ? 'Creating…' : `Create ${kind}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
