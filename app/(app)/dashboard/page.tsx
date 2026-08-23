import { createClient } from '@/lib/supabase/server';
import PageHeader from '@/components/PageHeader';
import MonthsaryBanner from '@/components/MonthsaryBanner';
import GalleryView from '@/components/GalleryView';
import EmptyState from '@/components/EmptyState';
import MonthsaryCountdown from '@/components/MonthsaryCountdown';
import Link from 'next/link';
import { GalleryVertical, Heart, FolderHeart, CalendarHeart } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: recent }, { data: favorites }, { data: albums }, { data: settings }, { data: reminder }, { data: profile }] = await Promise.all([
    supabase.from('media').select('*').eq('is_deleted', false).eq('is_archived', false).order('taken_at', { ascending: false }).limit(10),
    supabase.from('media').select('*').eq('is_favorite', true).eq('is_deleted', false).order('taken_at', { ascending: false }).limit(6),
    supabase.from('albums').select('*').eq('is_archived', false).order('created_at', { ascending: false }).limit(4),
    supabase.from('app_settings').select('*').single(),
    supabase.from('reminders').select('*').eq('reminder_type', 'monthsary').single(),
    supabase.from('profiles').select('*').eq('id', user?.id).single(),
  ]);

  const firstName = profile?.display_name?.split(' ')[0] || 'there';
  const hour = Number(new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    hour: '2-digit',
    hourCycle: 'h23',
  }).format(new Date()));
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      <PageHeader title={`${greeting}, ${firstName} 🤍`} subtitle="Welcome back to Our Memories." />
      <MonthsaryBanner settings={settings ?? null} reminder={reminder ?? null} />

      <div className="px-4 sm:px-8 py-6 space-y-10">
        {reminder?.enabled && <MonthsaryCountdown day={reminder.reminder_day} />}

        <section>
          <SectionHeader icon={GalleryVertical} title="Recent memories" href="/memories" />
          {recent && recent.length > 0 ? (
            <GalleryView initialItems={recent} />
          ) : (
            <EmptyState icon={GalleryVertical} title="Your story starts here ❤️" subtitle="Add your first photo or video to begin." />
          )}
        </section>

        <section>
          <SectionHeader icon={Heart} title="Favorite memories" href="/favorites" />
          {favorites && favorites.length > 0 ? (
            <GalleryView initialItems={favorites} />
          ) : (
            <EmptyState icon={Heart} title="No favorites yet" subtitle="Save the moments you never want to forget." />
          )}
        </section>

        <section>
          <SectionHeader icon={FolderHeart} title="Albums" href="/albums" />
          {albums && albums.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {albums.map((a) => (
                <Link key={a.id} href={`/albums/${a.id}`} className="rounded-2xl border border-line p-4 hover:border-wine/40 transition-colors">
                  <p className="text-sm font-medium text-ink truncate">{a.name}</p>
                  {a.description && <p className="text-xs text-ink-soft truncate mt-0.5">{a.description}</p>}
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState icon={FolderHeart} title="Create your first album" subtitle="Group memories from a trip, a birthday, or any moment worth keeping together." />
          )}
        </section>

        <Link
          href="/monthly"
          className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-gold-soft/60 to-paper-raised border border-line px-5 py-4"
        >
          <div className="flex items-center gap-3">
            <CalendarHeart className="h-5 w-5 text-gold" />
            <div>
              <p className="text-sm font-medium text-ink">This month&apos;s slideshow</p>
              <p className="text-xs text-ink-soft">Relive everything you added this month.</p>
            </div>
          </div>
          <span className="text-xs font-medium text-wine">View →</span>
        </Link>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, href }: { icon: typeof Heart; title: string; href: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="flex items-center gap-2 font-display italic text-xl text-ink">
        <Icon className="h-4 w-4 text-wine" /> {title}
      </h2>
      <Link href={href} className="text-xs font-medium text-wine hover:underline">See all</Link>
    </div>
  );
}
