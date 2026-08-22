'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Trash2, Archive, Download, Check, X } from 'lucide-react';
import Link from 'next/link';
import GalleryView from './GalleryView';
import EmptyState from './EmptyState';
import { FolderHeart } from 'lucide-react';
import type { Album, Collection, Media } from '@/types/database';
import {
  renameAlbum, deleteAlbum, setAlbumArchived,
  renameCollection, deleteCollection, setCollectionArchived,
} from '@/lib/collection-service';

export default function CollectionDetailView({
  kind,
  item,
  media,
  backHref,
}: {
  kind: 'album' | 'collection';
  item: Album | Collection;
  media: Media[];
  backHref: string;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description || '');
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleSave() {
    setSaving(true);
    try {
      if (kind === 'album') await renameAlbum(item.id, name, description);
      else await renameCollection(item.id, name, description);
      setEditing(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const noun = kind === 'album' ? 'album' : 'collection';
    if (!confirm(`Delete this ${noun}? Its memories will stay in your library — only the ${noun} itself is removed.`)) return;
    if (kind === 'album') await deleteAlbum(item.id);
    else await deleteCollection(item.id);
    router.push(backHref);
    router.refresh();
  }

  async function handleArchive() {
    if (kind === 'album') await setAlbumArchived(item.id, !item.is_archived);
    else await setCollectionArchived(item.id, !item.is_archived);
    router.refresh();
  }

  async function handleDownloadAll() {
    const ids = media.map((m) => m.id).join(',');
    window.location.href = `/api/download?ids=${ids}&zipName=${encodeURIComponent(item.name)}`;
  }

  return (
    <div>
      <header className="sticky top-0 z-20 bg-paper/85 backdrop-blur border-b border-line px-4 sm:px-8 py-4">
        <Link href={backHref} className="inline-flex items-center gap-1.5 text-xs text-ink-soft hover:text-ink mb-3">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to {kind === 'album' ? 'albums' : 'collections'}
        </Link>

        {editing ? (
          <div className="max-w-md space-y-2">
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-line bg-paper-raised px-3 py-2 text-lg font-display italic text-ink" />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full rounded-lg border border-line bg-paper-raised px-3 py-2 text-sm text-ink" placeholder="Description" />
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 text-xs bg-wine text-white rounded-full px-3 py-1.5"><Check className="h-3 w-3" /> Save</button>
              <button onClick={() => setEditing(false)} className="flex items-center gap-1 text-xs bg-line/50 text-ink-soft rounded-full px-3 py-1.5"><X className="h-3 w-3" /> Cancel</button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-display italic text-2xl sm:text-3xl text-ink truncate">{item.name}</h1>
              {item.description && <p className="text-sm text-ink-soft mt-0.5">{item.description}</p>}
              <p className="text-xs text-ink-soft mt-1">{media.length} {media.length === 1 ? 'memory' : 'memories'}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <IconBtn label="Rename" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" /></IconBtn>
              <IconBtn label="Download all" onClick={handleDownloadAll}><Download className="h-4 w-4" /></IconBtn>
              <IconBtn label="Archive" onClick={handleArchive}><Archive className="h-4 w-4" /></IconBtn>
              <IconBtn label="Delete" onClick={handleDelete}><Trash2 className="h-4 w-4" /></IconBtn>
            </div>
          </div>
        )}
      </header>

      <div className="px-4 sm:px-8 py-6">
        {media.length === 0 ? (
          <EmptyState icon={FolderHeart} title="Nothing here yet" subtitle="Add memories from the uploader, or open a memory and use “Add to…”." />
        ) : (
          <GalleryView initialItems={media} />
        )}
      </div>
    </div>
  );
}

function IconBtn({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} aria-label={label} className="h-9 w-9 rounded-full flex items-center justify-center text-ink-soft hover:bg-line/40 hover:text-ink">
      {children}
    </button>
  );
}
