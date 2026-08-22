'use client';

import type { Media } from '@/types/database';
import MediaCard from './MediaCard';
import { monthYearLabel } from '@/lib/utils';

export default function MediaGrid({
  items,
  groupByMonth = false,
  onOpen,
  selectedIds,
  selectable,
  onToggleSelect,
}: {
  items: Media[];
  groupByMonth?: boolean;
  onOpen: (index: number, list: Media[]) => void;
  selectedIds?: Set<string>;
  selectable?: boolean;
  onToggleSelect?: (id: string) => void;
}) {
  if (!groupByMonth) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
        {items.map((m, i) => (
          <MediaCard
            key={m.id}
            media={m}
            onOpen={() => onOpen(i, items)}
            selected={selectedIds?.has(m.id)}
            selectable={selectable}
            onToggleSelect={() => onToggleSelect?.(m.id)}
          />
        ))}
      </div>
    );
  }

  const groups = new Map<string, Media[]>();
  for (const m of items) {
    const key = monthYearLabel(m.taken_at || m.uploaded_at);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
  }

  return (
    <div className="space-y-10">
      {Array.from(groups.entries()).map(([label, group]) => (
        <section key={label}>
          <h2 className="font-display italic text-xl text-ink mb-3">{label}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
            {group.map((m) => {
              const globalIndex = items.indexOf(m);
              return (
                <MediaCard
                  key={m.id}
                  media={m}
                  onOpen={() => onOpen(globalIndex, items)}
                  selected={selectedIds?.has(m.id)}
                  selectable={selectable}
                  onToggleSelect={() => onToggleSelect?.(m.id)}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
