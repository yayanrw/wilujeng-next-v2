type Tone = 'neutral' | 'danger' | 'warning' | 'success' | 'info';

const toneValue: Record<Tone, string> = {
  neutral: 'text-zinc-900 dark:text-zinc-100',
  danger: 'text-red-600 dark:text-red-400',
  warning: 'text-amber-600 dark:text-amber-400',
  success: 'text-emerald-600 dark:text-emerald-400',
  info: 'text-blue-600 dark:text-blue-400',
};

const toneRing: Record<Tone, string> = {
  neutral: 'ring-zinc-900 dark:ring-zinc-100',
  danger: 'ring-red-500 dark:ring-red-400',
  warning: 'ring-amber-500 dark:ring-amber-400',
  success: 'ring-emerald-500 dark:ring-emerald-400',
  info: 'ring-blue-500 dark:ring-blue-400',
};

export function StatCard({
  label,
  value,
  tone = 'neutral',
  active = false,
  clickable = true,
  loading = false,
  onClick,
}: {
  label: string;
  value: string | number;
  tone?: Tone;
  active?: boolean;
  clickable?: boolean;
  loading?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? onClick : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick?.();
            }
          : undefined
      }
      className={[
        'rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 flex flex-col gap-1 transition-colors',
        clickable
          ? 'cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 select-none'
          : 'cursor-default',
        active ? `ring-2 ${toneRing[tone]}` : '',
      ].join(' ')}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 truncate leading-none">
        {label}
      </div>
      {loading ? (
        <div className="h-7 w-16 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse mt-0.5" />
      ) : (
        <div
          className={`text-xl font-bold tabular-nums leading-tight ${toneValue[tone]}`}
        >
          {value}
        </div>
      )}
    </div>
  );
}
