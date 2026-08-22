'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import PageHeader from '@/components/PageHeader';
import GalleryView from '@/components/GalleryView';
import EmptyState from '@/components/EmptyState';
import { GalleryVertical } from 'lucide-react';
import type { Album, Collection, Media } from '@/types/database';

type MediaFilter = 'all' | 'photo' | 'video' | 'favorite';

export default function MemoriesPage() {
  const [items, setItems] = useState<Media[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<MediaFilter>('all');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from('media').select('*').eq('is_deleted', false).eq('is_archived', false).order('taken_at', { ascending: false }),
      supabase.from('albums').select('*').eq('is_archived', false),
      supabase.from('collections').select('*').eq('is_archived', false),
    ]).then(([m, a, c]) => {
      setItems(m.data ?? []);
      setAlbums(a.data ?? []);
      setCollections(c.data ?? []);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    let list = items;
    if (filter === 'photo') list = list.filter((m) => m.media_type === 'photo');
    if (filter === 'video') list = list.filter((m) => m.media_type === 'video');
    if (filter === 'favorite') list = list.filter((m) => m.is_favorite);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.caption?.toLowerCase().includes(q) ||
          m.file_name.toLowerCase().includes(q) ||
          (m.taken_at && new Date(m.taken_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toLowerCase().includes(q))
      );
    }
    list = [...list].sort((a, b) => {
      const da = new Date(a.taken_at || a.uploaded_at).getTime();
      const db = new Date(b.taken_at || b.uploaded_at).getTime();
      return sort === 'newest' ? db - da : da - db;
    });
    return list;
  }, [items, filter, search, sort]);

  return (
    <div>
      <PageHeader title="Our Memories" subtitle="Every photo and video, in order." search={search} onSearchChange={setSearch} />

      <div className="px-4 sm:px-8 pt-4 flex flex-wrap items-center gap-2">
        {(['all', 'photo', 'video', 'favorite'] as MediaFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-medium rounded-full px-3 py-1.5 capitalize ${filter === f ? 'bg-wine text-white' : 'bg-line/40 text-ink-soft'}`}
          >
            {f === 'all' ? 'All' : f === 'favorite' ? 'Favorites' : `${f}s`}
          </button>
        ))}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as 'newest' | 'oldest')}
          className="ml-auto text-xs rounded-full border border-line bg-paper px-3 py-1.5 text-ink-soft"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      <div className="px-4 sm:px-8 py-6">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-line/40 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={GalleryVertical} title="Your story starts here ❤️" subtitle="Nothing matches yet — try a different search or add a new memory." />
        ) : (
          <GalleryView initialItems={filtered} groupByMonth albums={albums} collections={collections} />
        )}
      </div>
    </div>
  );
}
