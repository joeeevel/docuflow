const phases = [
  { key: 'pending', label: 'Ingestion', desc: 'Validating & queuing', icon: '📥' },
  { key: 'processing', label: 'Processing', desc: 'Transcribing & analyzing', icon: '⚙' },
  { key: 'completed', label: 'Generation', desc: 'Building documentation', icon: '📄' },
]

export function Pipeline({ status }: { status: string }) {
  const currentIdx = phases.findIndex((p) => p.key === status) + (status === 'completed' ? 1 : status === 'failed' ? -1 : 0)

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between">
        {phases.map((phase, i) => {
          const active = i <= currentIdx
          const isCurrent = i === currentIdx && status !== 'completed' && status !== 'failed'
          return (
            <div key={phase.key} className="flex-1 relative">
              <div className="flex flex-col items-center">
                <div
                  className={`size-10 rounded-xl flex items-center justify-center text-lg transition-all duration-500 ${
                    isCurrent
                      ? 'bg-accent-500/20 border-2 border-accent-400 pipeline-glow animate-float'
                      : active
                        ? 'bg-accent-500/15 border border-accent-500/30'
                        : 'bg-deep-800 border border-surface-800/30 text-surface-600'
                  }`}
                >
                  {phase.icon}
                </div>
                <p className={`text-xs font-medium mt-2 ${active ? 'text-accent-300' : 'text-surface-600'}`}>{phase.label}</p>
                <p className={`text-[10px] mt-0.5 ${active ? 'text-surface-500' : 'text-surface-700'}`}>{phase.desc}</p>
              </div>
              {i < phases.length - 1 && (
                <div className="absolute top-5 left-[calc(50%+1.25rem)] right-[calc(-50%+1.25rem)] h-px">
                  <div className={`h-full transition-all duration-700 ${i < currentIdx ? 'bg-accent-500/40' : 'bg-surface-800/30'}`}>
                    {isCurrent && <div className="h-full bg-accent-400/50 animate-shimmer" />}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {status === 'failed' && (
        <p className="text-center text-xs text-red-400 mt-4">Processing failed — check error details</p>
      )}
    </div>
  )
}
