import { useState, useEffect } from 'react'
import { api, type Job } from '../lib/api'
import { StatsCards } from '../components/dashboard/StatsCards'
import { JobTable } from '../components/dashboard/JobTable'
import { Button } from '../components/ui/Button'
import { useNavigate } from 'react-router-dom'

export function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.listJobs()
      .then((res) => setJobs(res.jobs))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-100">Dashboard</h1>
          <p className="text-surface-500 text-sm mt-1">Monitor and manage your documentation jobs</p>
        </div>
        <Button onClick={() => navigate('/new')}>+ New Job</Button>
      </div>

      <StatsCards jobs={jobs} />

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-surface-100 mb-4">Recent Jobs</h2>
        {loading ? (
          <div className="glass rounded-2xl p-12 text-center text-surface-600">Loading...</div>
        ) : (
          <JobTable jobs={jobs} />
        )}
      </div>
    </div>
  )
}
