'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, X } from 'lucide-react';
import { monthsBetween, isMonthsaryToday } from '@/lib/utils';
import type { AppSettings, Reminder } from '@/types/database';

export default function MonthsaryBanner({ settings, reminder }: { settings: AppSettings | null; reminder: Reminder | null }) {
  const [dismissed, setDismissed] = useState(false);

  if (!reminder?.enabled || dismissed) return null;
  const today = isMonthsaryToday(reminder.reminder_day);
  if (!today) return null;

  const months = settings?.relationship_start_date ? monthsBetween(settings.relationship_start_date) : null;

  return (
    <div className="relative mx-4 sm:mx-0 mt-4 rounded-2xl bg-gradient-to-r from-wine to-wine-deep text-white px-5 py-4 flex items-center gap-4 overflow-hidden">
      <div className="h-10 w-10 rounded-full bg-white/15 flex items-center justify-center shrink-0">
        <Heart className="h-5 w-5" fill="white" strokeWidth={0} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display italic text-lg leading-tight">Happy Monthsary!</p>
        <p className="text-sm text-white/85">
          {reminder.message}
          {months !== null && <> You&rsquo;ve shared {months} {months === 1 ? 'month' : 'months'} together.</>}
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          <Link href="/memories" className="text-xs bg-white/15 hover:bg-white/25 rounded-full px-3 py-1.5">
            See this month&apos;s memories
          </Link>
          <Link href="/monthly" className="text-xs bg-white text-wine-deep hover:bg-white/90 rounded-full px-3 py-1.5 font-medium">
            Start the slideshow
          </Link>
        </div>
      </div>
      <button onClick={() => setDismissed(true)} aria-label="Dismiss" className="absolute top-3 right-3 h-6 w-6 flex items-center justify-center rounded-full hover:bg-white/15">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
