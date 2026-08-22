import { type LucideIcon } from 'lucide-react';

export default function EmptyState({
  icon: Icon,
  title,
  subtitle,
  action,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6">
      <div className="h-14 w-14 rounded-full bg-gold-soft/60 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-wine" />
      </div>
      <p className="font-display italic text-xl text-ink mb-1">{title}</p>
      {subtitle && <p className="text-sm text-ink-soft max-w-xs">{subtitle}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
