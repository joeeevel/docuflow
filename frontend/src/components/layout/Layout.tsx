import { Sidebar } from './Sidebar'

interface LayoutProps {
  children: React.ReactNode
  onLogout: () => void
}

export function Layout({ children, onLogout }: LayoutProps) {
  return (
    <div className="min-h-screen bg-deep-950">
      <Sidebar onLogout={onLogout} />
      <main className="ml-56 p-8">
        {children}
      </main>
    </div>
  )
}
