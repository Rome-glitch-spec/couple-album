'use client';

import { createClient } from '@/lib/supabase/client';
import type { AppSettings, Reminder } from '@/types/database';

export async function updateAppSettings(patch: Partial<AppSettings>) {
  const supabase = createClient();
  const { error } = await supabase.from('app_settings').update(patch).eq('id', 1);
  if (error) throw new Error('Could not save settings.');
}

export async function updateReminder(patch: Partial<Reminder>) {
  const supabase = createClient();
  const { error } = await supabase.from('reminders').update(patch).eq('reminder_type', 'monthsary');
  if (error) throw new Error('Could not save reminder.');
}

export async function updateDisplayName(userId: string, displayName: string) {
  const supabase = createClient();
  const { error } = await supabase.from('profiles').update({ display_name: displayName }).eq('id', userId);
  if (error) throw new Error('Could not update name.');
}

export async function changePassword(newPassword: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  return Notification.requestPermission();
}
