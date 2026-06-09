import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function NewJob() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.createJob(url)
      navigate(`/job/${res.jobId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-100">New Documentation Job</h1>
        <p className="text-surface-500 text-sm mt-1">Paste a video link to generate structured documentation</p>
      </div>

      <div className="glass rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Video URL"
            placeholder="https://loom.com/share/..., https://youtube.com/..., or direct MP4 link"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button type="submit" loading={loading}>
              Start Processing
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/')}>
              Cancel
            </Button>
          </div>
        </form>
      </div>

      <div className="mt-6 glass-light rounded-2xl p-4">
        <p className="text-xs text-surface-500 font-medium mb-2">Supported sources</p>
        <div className="flex gap-4 text-xs text-surface-400">
          <span>📹 Loom</span>
          <span>▶ YouTube</span>
          <span>🔗 Direct MP4</span>
          <span>📁 Google Drive</span>
        </div>
      </div>
    </div>
  )
}
