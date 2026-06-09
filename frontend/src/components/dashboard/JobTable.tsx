import { useNavigate } from 'react-router-dom'
import { Badge } from '../ui/Badge'
import type { Job } from '../../lib/api'

export function JobTable({ jobs }: { jobs: Job[] }) {
  const navigate = useNavigate()

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              {['Source', 'Status', 'Created', 'Title'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-surface-500 font-medium text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr
                key={job._id}
                onClick={() => navigate(`/job/${job._id}`)}
                className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
              >
                <td className="px-4 py-3 text-surface-300 font-mono text-xs max-w-[200px] truncate">{job.sourceUrl}</td>
                <td className="px-4 py-3"><Badge status={job.status} /></td>
                <td className="px-4 py-3 text-surface-500 text-xs">{new Date(job.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-surface-300">{job.generatedDoc?.title || '—'}</td>
              </tr>
            ))}
            {jobs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-surface-600">
                  No jobs yet. Submit your first video!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
