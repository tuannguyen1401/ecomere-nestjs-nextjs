'use client';

interface Props {
  status: string;
  size?: 'sm' | 'md';
}

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  pending:    { bg: 'bg-yellow-100 dark:bg-yellow-950/30', text: 'text-yellow-800 dark:text-yellow-300', dot: 'bg-yellow-500' },
  confirmed:  { bg: 'bg-blue-100 dark:bg-blue-950/30', text: 'text-blue-800 dark:text-blue-300', dot: 'bg-blue-500' },
  processing: { bg: 'bg-indigo-100 dark:bg-indigo-950/30', text: 'text-indigo-800 dark:text-indigo-300', dot: 'bg-indigo-500' },
  shipped:    { bg: 'bg-violet-100 dark:bg-violet-950/30', text: 'text-violet-800 dark:text-violet-300', dot: 'bg-violet-500' },
  delivered:  { bg: 'bg-emerald-100 dark:bg-emerald-950/30', text: 'text-emerald-800 dark:text-emerald-300', dot: 'bg-emerald-500' },
  cancelled:  { bg: 'bg-red-100 dark:bg-red-950/30', text: 'text-red-800 dark:text-red-300', dot: 'bg-red-500' },
};

export default function OrderStatusBadge({ status, size = 'md' }: Props) {
  const c = STATUS_COLORS[status] ?? STATUS_COLORS.pending;
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold ${c.bg} ${c.text} ${textSize}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
