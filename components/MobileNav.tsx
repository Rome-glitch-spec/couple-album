'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Home, GalleryVertical, FolderHeart, Heart, Plus, Menu, X, Layers, Archive, Trash2, Wand2, Settings, LogOut, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const PRIMARY = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/memories', label: 'Memories', icon: GalleryVertical },
];
const SECONDARY_MENU = [
  { href: '/albums', label: 'Albums', icon: FolderHeart },
  { href: '/collections', label: 'Collections', icon: Layers },
  { href: '/archive', label: 'Archive', icon: Archive },
  { href: '/trash', label: 'Trash', icon: Trash2 },
  { href: '/collage', label: 'Collage Maker', icon: Wand2 },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/chat', label: 'Chat', icon: MessageCircle },
];

export default function MobileNav({ onAdd }: { onAdd: () => void }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-paper-raised border-t border-line pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5 items-center h-16 px-1">
          {PRIMARY.map(({ href, label, icon: Icon }) => (
            <Tab key={href} href={href} label={label} Icon={Icon} active={pathname === href} />
          ))}
          <button onClick={onAdd} aria-label="Add memory" className="flex flex-col items-center justify-center">
            <span className="h-11 w-11 rounded-full bg-wine flex items-center justify-center -mt-6 shadow-lg shadow-wine/30">
              <Plus className="h-5 w-5 text-white" />
            </span>
          </button>
          <Tab href="/favorites" label="Favorites" Icon={Heart} active={pathname === '/favorites'} />
          <button onClick={() => setMenuOpen(true)} aria-label="More" className="flex flex-col items-center justify-center gap-0.5 text-[10px] text-ink-soft">
            <Menu className="h-5 w-5" />
            More
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50 flex items-end" onClick={() => setMenuOpen(false)}>
          <div className="w-full bg-paper-raised rounded-t-3xl p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="font-display italic text-lg text-ink">More</span>
              <button onClick={() => setMenuOpen(false)} aria-label="Close"><X className="h-5 w-5 text-ink-soft" /></button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {SECONDARY_MENU.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="flex flex-col items-center gap-1.5 rounded-2xl border border-line py-4 text-xs text-ink">
                  <Icon className="h-5 w-5 text-wine" />
                  {label}
                </Link>
              ))}
              <button onClick={handleLogout} className="flex flex-col items-center gap-1.5 rounded-2xl border border-line py-4 text-xs text-ink">
                <LogOut className="h-5 w-5 text-wine" />
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Tab({ href, label, Icon, active }: { href: string; label: string; Icon: typeof Home; active: boolean }) {
  return (
    <Link href={href} className={cn('flex flex-col items-center justify-center gap-0.5 text-[10px]', active ? 'text-wine' : 'text-ink-soft')}>
      <Icon className={cn('h-5 w-5', active && 'fill-wine/10')} />
      {label}
    </Link>
  );
}
