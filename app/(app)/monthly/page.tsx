'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import PageHeader from '@/components/PageHeader';
import Slideshow from '@/components/Slideshow';
import EmptyState from '@/components/EmptyState';
import SignedImage from '@/components/SignedImage';
import { CalendarHeart, Play } from 'lucide-react';
import type { Media } from '@/types/database';
import { monthYearLabel } from '@/lib/utils';

export default function MonthlyPage() {
  const [items, setItems] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMonth, setActiveMonth] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('media')
      .select('*')
      .eq('is_deleted', false)
      .eq('is_archived', false)
      .order('taken_at', { ascending: false })
      .then(({ data }) => {
        setItems(data ?? []);
        setLoading(false);
      });
  }, []);

  const months = useMemo(() => {
    const groups = new Map<string, Media[]>();
    for (const m of items) {
      const key = monthYearLabel(m.taken_at || m.uploaded_at);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(m);
    }
    return Array.from(groups.entries());
  }, [items]);

  const currentMonthLabel = monthYearLabel(new Date().toISOString());
  const activeItems = activeMonth ? months.find(([label]) => label === activeMonth)?.[1] ?? [] : [];

  return (
    <div>
      <PageHeader title="Monthly Memories" subtitle="A cinematic recap of each month, automatically put together." showAdd={false} />

      <div className="px-4 sm:px-8 py-6">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-video rounded-2xl bg-line/40 animate-pulse" />)}
          </div>
        ) : months.length === 0 ? (
          <EmptyState icon={CalendarHeart} title="No monthly memories yet" subtitle="Once you add photos or videos, each month gets its own slideshow here." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {months.map(([label, group]) => (
              <button
                key={label}
                onClick={() => setActiveMonth(label)}
                className="group relative aspect-video rounded-2xl overflow-hidden border border-line text-left"
              >
                <SignedImage
                  path={group[0].thumbnail_path || group[0].storage_path}
                  alt={label}
                  className="absolute inset-0 h-full w-full"
                  imgClassName="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 flex items-end justify-between">
                  <div>
                    <p className="font-display italic text-lg text-white">{label}{label === currentMonthLabel && ' · This month'}</p>
                    <p className="text-xs text-white/75">{group.length} {group.length === 1 ? 'memory' : 'memories'}</p>
                  </div>
                  <span className="h-9 w-9 rounded-full bg-white flex items-center justify-center shrink-0">
                    <Play className="h-4 w-4 text-wine ml-0.5" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {activeMonth && activeItems.length > 0 && (
        <Slideshow items={activeItems} title={activeMonth} onClose={() => setActiveMonth(null)} />
      )}
    </div>
  );
}
