import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Dashboard', icon: '▦' },
  { to: '/new', label: 'New Job', icon: '+' },
]

export function Sidebar({ onLogout }: { onLogout: () => void }) {
  return (
    <aside className="fixed left-0 top-0 h-full w-56 glass border-r border-accent-500/10 flex flex-col z-40">
      <div className="p-5 border-b border-white/5">
        <h1 className="text-xl font-bold text-gradient">DocuFlow</h1>
        <p className="text-xs text-surface-500 mt-0.5">Documentation Engine</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                isActive
                  ? 'bg-accent-500/10 text-accent-300 border border-accent-500/20'
                  : 'text-surface-400 hover:text-surface-200 hover:bg-white/5'
              }`
            }
          >
            <span className="text-lg">{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-white/5">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-surface-500 hover:text-red-400 hover:bg-red-500/10 w-full transition-all cursor-pointer"
        >
          <span className="text-lg">↩</span>
          Logout
        </button>
      </div>
    </aside>
  )
}
