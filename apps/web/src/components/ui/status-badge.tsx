import { STATUS_COLORS, STATUS_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? '#94a3b8';
  const label = STATUS_LABELS[status] ?? status;

  const isActive = ['crawling', 'analyzing', 'ai_processing', 'generating_report'].includes(status);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        isActive && 'animate-pulse',
      )}
      style={{ backgroundColor: `${color}20`, color }}
    >
      {isActive && (
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      {label}
    </span>
  );
}
