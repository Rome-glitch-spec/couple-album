'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home, GalleryVertical, FolderHeart, Layers, Heart, CalendarHeart,
  Archive, Trash2, Wand2, Settings, LogOut, HeartHandshake,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import type { Profile } from '@/types/database';

const NAV = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/memories', label: 'Memories', icon: GalleryVertical },
  { href: '/albums', label: 'Albums', icon: FolderHeart },
  { href: '/collections', label: 'Collections', icon: Layers },
  { href: '/favorites', label: 'Favorites', icon: Heart },
  { href: '/monthly', label: 'Monthly Memories', icon: CalendarHeart },
  { href: '/archive', label: 'Archive', icon: Archive },
  { href: '/trash', label: 'Trash', icon: Trash2 },
  { href: '/collage', label: 'Collage Maker', icon: Wand2 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ profile, partner }: { profile: Profile | null; partner: Profile | null }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 h-dvh sticky top-0 border-r border-line bg-paper-raised/60 px-4 py-6">
      <div className="flex items-center gap-2 px-2 mb-8">
        <div className="h-8 w-8 rounded-full bg-wine flex items-center justify-center shrink-0">
          <HeartHandshake className="h-4 w-4 text-white" />
        </div>
        <span className="font-display italic text-lg text-ink">Our Memories</span>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                active ? 'bg-wine text-white' : 'text-ink-soft hover:bg-line/40 hover:text-ink'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line pt-4 mt-4">
        <div className="flex items-center gap-2 px-2 mb-2">
          <div className="flex -space-x-2">
            <div className="h-7 w-7 rounded-full bg-gold-soft border-2 border-paper-raised flex items-center justify-center text-[10px] font-semibold text-ink">
              {initials(profile?.display_name)}
            </div>
            {partner && (
              <div className="h-7 w-7 rounded-full bg-wine/20 border-2 border-paper-raised flex items-center justify-center text-[10px] font-semibold text-wine-deep">
                {initials(partner.display_name)}
              </div>
            )}
          </div>
          <span className="text-xs text-ink-soft truncate">
            {profile?.display_name}{partner ? ` & ${partner.display_name}` : ''}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink-soft hover:bg-line/40 hover:text-ink"
        >
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </div>
    </aside>
  );
}

function initials(name?: string) {
  if (!name) return '?';
  return name.slice(0, 2).toUpperCase();
}
