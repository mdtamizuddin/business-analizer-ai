import { getScoreGrade } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function ScoreCircle({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const { grade, color } = getScoreGrade(score);

  const dimensions = {
    sm: 'w-16 h-16 text-xl',
    md: 'w-24 h-24 text-3xl',
    lg: 'w-32 h-32 text-4xl',
  };

  const stroke = {
    sm: 4,
    md: 6,
    lg: 8,
  };

  const radius = size === 'sm' ? 26 : size === 'md' ? 38 : 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', dimensions[size])}>
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="#263247" strokeWidth={stroke[size]} />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke[size]}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="flex flex-col items-center">
        <span className="font-bold text-text-primary">{score}</span>
        <span className="text-xs font-medium" style={{ color }}>
          {grade}
        </span>
      </div>
    </div>
  );
}
