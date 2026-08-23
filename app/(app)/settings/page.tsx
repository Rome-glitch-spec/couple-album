'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import PageHeader from '@/components/PageHeader';
import { updateAppSettings, updateReminder, updateDisplayName, changePassword, requestBrowserNotificationPermission } from '@/lib/settings-service';
import { formatBytes, cn } from '@/lib/utils';
import { Check, Sun, Moon, Monitor, Palette, ImagePlus, X } from 'lucide-react';
import type { AppSettings, Reminder, Profile } from '@/types/database';

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [reminderDay, setReminderDay] = useState(22);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [reminderMessage, setReminderMessage] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [browserNotif, setBrowserNotif] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [wallpaper, setWallpaper] = useState<'default' | 'linen' | 'petals' | 'plain'>('default');
  const [wallpaperImage, setWallpaperImage] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [stats, setStats] = useState({ photos: 0, videos: 0, bytes: 0 });
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: prof }, { data: s }, { data: r }, { data: media }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('app_settings').select('*').single(),
        supabase.from('reminders').select('*').eq('reminder_type', 'monthsary').single(),
        supabase.from('media').select('media_type,file_size').eq('is_deleted', false),
      ]);
      if (prof) { setProfile(prof); setDisplayName(prof.display_name); }
      if (s) { setSettings(s); setStartDate(s.relationship_start_date || ''); setBrowserNotif(!!s.notification_settings?.browser); }
      if (r) { setReminder(r); setReminderDay(r.reminder_day); setReminderTime(r.reminder_time?.slice(0,5) || '09:00'); setReminderMessage(r.message); setReminderEnabled(r.enabled); }
      if (media) {
        setStats({
          photos: media.filter((m) => m.media_type === 'photo').length,
          videos: media.filter((m) => m.media_type === 'video').length,
          bytes: media.reduce((sum, m) => sum + (m.file_size || 0), 0),
        });
      }
    })();
    const savedTheme = (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system';
    setTheme(savedTheme);
    const savedWallpaper = (localStorage.getItem('wallpaper') as 'default' | 'linen' | 'petals' | 'plain') || 'default';
    setWallpaper(savedWallpaper);
    setWallpaperImage(localStorage.getItem('wallpaper-image') || '');
  }, []);

  useEffect(() => {
    document.documentElement.dataset.wallpaper = wallpaper;
  }, [wallpaper]);

  useEffect(() => {
    if (wallpaperImage) {
      document.documentElement.style.setProperty('--wallpaper-image', `url(${wallpaperImage})`);
    } else {
      document.documentElement.style.removeProperty('--wallpaper-image');
    }
  }, [wallpaperImage]);

  function flashSaved(label: string) {
    setSaved(label);
    setTimeout(() => setSaved(null), 2000);
  }

  async function saveCoupleSettings() {
    await updateAppSettings({ relationship_start_date: startDate || null });
    await updateReminder({ reminder_day: reminderDay, reminder_time: reminderTime, message: reminderMessage, enabled: reminderEnabled });
    flashSaved('Couple settings saved');
  }

  async function saveAccount() {
    if (!profile) return;
    await updateDisplayName(profile.id, displayName);
    flashSaved('Display name updated');
  }

  async function saveNotifications() {
    await updateAppSettings({ notification_settings: { in_app: true, browser: browserNotif } });
    if (browserNotif) await requestBrowserNotificationPermission();
    flashSaved('Notification preferences saved');
  }

  async function handleChangePassword() {
    if (newPassword.length < 8) { alert('Password should be at least 8 characters.'); return; }
    await changePassword(newPassword);
    setNewPassword('');
    flashSaved('Password changed');
  }

  function applyTheme(next: 'light' | 'dark' | 'system') {
    setTheme(next);
    localStorage.setItem('theme', next);
    const isDark = next === 'dark' || (next === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
  }

  function applyWallpaper(next: 'default' | 'linen' | 'petals' | 'plain') {
    setWallpaper(next);
    localStorage.setItem('wallpaper', next);
  }

  function applyWallpaperImage(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const image = typeof reader.result === 'string' ? reader.result : '';
      if (!image) return;
      try {
        localStorage.setItem('wallpaper-image', image);
        setWallpaperImage(image);
      } catch {
        alert('That picture is too large to use as a wallpaper. Please choose a smaller picture.');
      }
    };
    reader.readAsDataURL(file);
  }

  function clearWallpaperImage() {
    localStorage.removeItem('wallpaper-image');
    setWallpaperImage('');
  }

  return (
    <div>
      <PageHeader title="Settings" showAdd={false} />

      <div className="px-4 sm:px-8 py-6 max-w-2xl space-y-8">
        {saved && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-full bg-sage text-white text-sm px-4 py-2 shadow-lg">
            <Check className="h-4 w-4" /> {saved}
          </div>
        )}

        <Section title="Account">
          <Field label="Display name">
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="input" />
          </Field>
          <Field label="Email">
            <input value={profile?.email || ''} disabled className="input opacity-60" />
          </Field>
          <Field label="New password">
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" className="input" />
          </Field>
          <div className="flex gap-2">
            <SaveBtn onClick={saveAccount}>Save profile</SaveBtn>
            {newPassword && <SaveBtn onClick={handleChangePassword}>Change password</SaveBtn>}
          </div>
        </Section>

        <Section title="Couple Settings">
          <Field label="Relationship start date">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" />
          </Field>
          <Field label="Monthsary day">
            <input type="number" min={1} max={28} value={reminderDay} onChange={(e) => setReminderDay(Number(e.target.value))} className="input" />
          </Field>
          <Field label="Reminder time">
            <input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} className="input" />
          </Field>
          <Field label="Reminder message">
            <textarea value={reminderMessage} onChange={(e) => setReminderMessage(e.target.value)} rows={2} className="input" />
          </Field>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={reminderEnabled} onChange={(e) => setReminderEnabled(e.target.checked)} className="accent-wine" />
            Enable monthsary reminder
          </label>
          <SaveBtn onClick={saveCoupleSettings}>Save couple settings</SaveBtn>
        </Section>

        <Section title="Notifications">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={browserNotif} onChange={(e) => setBrowserNotif(e.target.checked)} className="accent-wine" />
            Enable browser notifications (asks permission when saved)
          </label>
          <p className="text-xs text-ink-soft">In-app notifications are always on — this only adds an optional browser alert.</p>
          <SaveBtn onClick={saveNotifications}>Save notification preferences</SaveBtn>
        </Section>

        <Section title="Appearance">
          <div className="flex gap-2">
            {([['light', Sun], ['dark', Moon], ['system', Monitor]] as const).map(([key, Icon]) => (
              <button
                key={key}
                onClick={() => applyTheme(key)}
                className={cn('flex-1 flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs capitalize', theme === key ? 'border-wine text-wine bg-wine/5' : 'border-line text-ink-soft')}
              >
                <Icon className="h-4 w-4" /> {key}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-ink-soft pt-2">
            <Palette className="h-4 w-4" /> Wallpaper
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(['default', 'linen', 'petals', 'plain'] as const).map((key) => (
              <button
                key={key}
                onClick={() => applyWallpaper(key)}
                className={cn('rounded-xl border py-2.5 text-xs capitalize', wallpaper === key ? 'border-wine text-wine bg-wine/5' : 'border-line text-ink-soft')}
              >
                {key}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-2">
            <label className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-line py-2.5 text-xs text-ink-soft cursor-pointer hover:border-wine/40">
              <ImagePlus className="h-4 w-4" /> Use my picture
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (file) applyWallpaperImage(file);
                }}
              />
            </label>
            {wallpaperImage && (
              <button onClick={clearWallpaperImage} aria-label="Remove wallpaper picture" className="h-10 w-10 flex items-center justify-center rounded-xl border border-line text-ink-soft hover:border-wine/40">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </Section>

        <Section title="Storage">
          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat label="Photos" value={stats.photos} />
            <Stat label="Videos" value={stats.videos} />
            <Stat label="Used" value={formatBytes(stats.bytes)} />
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line p-5 space-y-3">
      <h2 className="font-display italic text-lg text-ink">{title}</h2>
      {children}
    </section>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-ink-soft mb-1 block">{label}</label>
      {children}
    </div>
  );
}
function SaveBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className="rounded-full bg-wine text-white text-sm font-medium px-4 py-2 hover:bg-wine-deep w-fit">{children}</button>;
}
function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-paper-raised border border-line py-3">
      <p className="text-lg font-display italic text-ink">{value}</p>
      <p className="text-[11px] text-ink-soft">{label}</p>
    </div>
  );
}
