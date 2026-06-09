const statusConfig = {
  pending: { label: 'Pending', class: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  processing: { label: 'Processing', class: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  completed: { label: 'Completed', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  failed: { label: 'Failed', class: 'bg-red-500/10 text-red-400 border-red-500/20' },
} as const

export function Badge({ status }: { status: keyof typeof statusConfig }) {
  const cfg = statusConfig[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.class}`}>
      <span className={`size-1.5 rounded-full ${status === 'processing' ? 'bg-blue-400 animate-pulse' : ''}`} />
      {cfg.label}
    </span>
  )
}
