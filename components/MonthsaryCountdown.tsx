'use client';

import { useEffect, useState } from 'react';
import { CalendarHeart } from 'lucide-react';

const PHILIPPINES_TIME_ZONE = 'Asia/Manila';
const SECOND = 1000;

function getNextMonthsary(day: number): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: PHILIPPINES_TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(new Date());
  const currentYear = Number(parts.find((part) => part.type === 'year')?.value);
  const currentMonth = Number(parts.find((part) => part.type === 'month')?.value) - 1;
  const currentDay = Number(parts.find((part) => part.type === 'day')?.value);
  const month = currentDay >= day ? currentMonth + 1 : currentMonth;
  return new Date(Date.UTC(currentYear, month, day) - 8 * 60 * 60 * 1000);
}

function getRemaining(target: Date) {
  const totalSeconds = Math.max(0, Math.floor((target.getTime() - Date.now()) / SECOND));
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export default function MonthsaryCountdown({ day }: { day: number }) {
  const [remaining, setRemaining] = useState(() => getRemaining(getNextMonthsary(day)));

  useEffect(() => {
    const target = getNextMonthsary(day);
    const update = () => setRemaining(getRemaining(target));
    const timer = window.setInterval(update, SECOND);
    update();
    return () => window.clearInterval(timer);
  }, [day]);

  return (
    <div className="flex items-center gap-2 text-sm text-ink-soft">
      <CalendarHeart className="h-4 w-4 text-gold" />
      <span>Next monthsary in</span>
      <span className="font-medium text-ink tabular-nums">
        {remaining.days}d {String(remaining.hours).padStart(2, '0')}h {String(remaining.minutes).padStart(2, '0')}m {String(remaining.seconds).padStart(2, '0')}s
      </span>
    </div>
  );
}