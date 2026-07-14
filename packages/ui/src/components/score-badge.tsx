import { getScoreGrade } from '../lib/score';
import { cn } from '../lib/utils';

export interface ScoreBadgeProps {
  score: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'text-sm px-2 py-1 min-w-[3rem]',
  md: 'text-base px-3 py-1.5 min-w-[4rem]',
  lg: 'text-2xl px-4 py-2 min-w-[5rem]',
};

export function ScoreBadge({ score, label, size = 'md', className }: ScoreBadgeProps) {
  const { grade, color } = getScoreGrade(score);

  return (
    <div className={cn('inline-flex flex-col items-center rounded-lg font-bold text-white', sizeClasses[size], className)} style={{ backgroundColor: color }}>
      <span>{score}</span>
      {label && <span className="text-xs font-normal opacity-90">{label}</span>}
      <span className="text-xs opacity-75">Grade {grade}</span>
    </div>
  );
}
