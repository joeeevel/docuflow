interface Stats {
  total: number
  completed: number
  failed: number
  processing: number
}

const cards = [
  { key: 'total', label: 'Total Jobs', color: 'text-accent-300', border: 'border-accent-500/20' },
  { key: 'completed', label: 'Completed', color: 'text-emerald-400', border: 'border-emerald-500/20' },
  { key: 'processing', label: 'In Progress', color: 'text-blue-400', border: 'border-blue-500/20' },
  { key: 'failed', label: 'Failed', color: 'text-red-400', border: 'border-red-500/20' },
] as const

export function StatsCards({ jobs }: { jobs: Array<{ status: string }> }) {
  const stats: Stats = {
    total: jobs.length,
    completed: jobs.filter((j) => j.status === 'completed').length,
    failed: jobs.filter((j) => j.status === 'failed').length,
    processing: jobs.filter((j) => j.status === 'processing' || j.status === 'pending').length,
  }

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.key} className={`glass rounded-2xl p-4 border ${c.border}`}>
          <p className="text-xs text-surface-500">{c.label}</p>
          <p className={`text-2xl font-bold mt-1 ${c.color}`}>{stats[c.key as keyof Stats]}</p>
        </div>
      ))}
    </div>
  )
}
