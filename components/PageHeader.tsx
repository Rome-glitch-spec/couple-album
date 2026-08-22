'use client';

import { Plus, Search } from 'lucide-react';
import { useUploadModal } from '@/lib/upload-context';

export default function PageHeader({
  title,
  subtitle,
  search,
  onSearchChange,
  action,
  showAdd = true,
}: {
  title: string;
  subtitle?: string;
  search?: string;
  onSearchChange?: (v: string) => void;
  action?: React.ReactNode;
  showAdd?: boolean;
}) {
  const { openUpload } = useUploadModal();

  return (
    <header className="sticky top-0 z-20 bg-paper/85 backdrop-blur border-b border-line px-4 sm:px-8 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display italic text-2xl sm:text-3xl text-ink truncate">{title}</h1>
          {subtitle && <p className="text-sm text-ink-soft mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {action}
          {showAdd && (
            <button
              onClick={openUpload}
              className="hidden sm:flex items-center gap-1.5 rounded-full bg-wine text-white text-sm font-medium px-4 py-2 hover:bg-wine-deep"
            >
              <Plus className="h-4 w-4" /> Add Memory
            </button>
          )}
        </div>
      </div>
      {onSearchChange && (
        <div className="relative mt-3 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search captions, filenames, dates…"
            className="w-full rounded-full border border-line bg-paper-raised pl-9 pr-4 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-wine/30"
          />
        </div>
      )}
    </header>
  );
}
