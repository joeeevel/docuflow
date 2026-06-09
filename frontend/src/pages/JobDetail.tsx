import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { api, type Job } from '../lib/api'
import { Badge } from '../components/ui/Badge'
import { Pipeline } from '../components/pipeline/Pipeline'

export function JobDetail() {
  const { id } = useParams<{ id: string }>()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!id) return
    const fetch = async () => {
      try {
        const res = await api.getJob(id)
        setJob(res.job)
      } catch {
        navigate('/')
      } finally {
        setLoading(false)
      }
    }
    fetch()
    const interval = setInterval(fetch, 3000)
    return () => clearInterval(interval)
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="size-8 border-2 border-accent-500/30 border-t-accent-400 rounded-full animate-spin" />
      </div>
    )
  }

  if (!job) return null

  const showVideo = job.sourceUrl.includes('youtube') || job.sourceUrl.includes('youtu.be') || job.sourceUrl.match(/\.(mp4|webm|mov)$/i)

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} className="text-surface-500 hover:text-surface-300 cursor-pointer">← Back</button>
        <Badge status={job.status} />
        <span className="text-xs text-surface-600 font-mono">{job._id}</span>
      </div>

      <Pipeline status={job.status} />

      {job.status === 'failed' && job.errorLog && (
        <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
          <p className="text-xs text-red-400 font-medium mb-1">Error</p>
          <p className="text-xs text-red-300/80 font-mono whitespace-pre-wrap">{job.errorLog}</p>
        </div>
      )}

      {job.generatedDoc && (
        <div className="mt-6 grid grid-cols-1 gap-6">
          {showVideo && (
            <div className="glass rounded-2xl overflow-hidden aspect-video">
              {job.sourceUrl.includes('youtube') || job.sourceUrl.includes('youtu.be') ? (
                <iframe
                  src={job.sourceUrl.replace('watch?v=', 'embed/').split('&')[0]}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video src={job.sourceUrl} controls className="w-full h-full" />
              )}
            </div>
          )}

          <div className="glass rounded-2xl p-6">
            <h2 className="text-xl font-bold text-surface-100 mb-2">{job.generatedDoc.title}</h2>
            <p className="text-surface-400 text-sm mb-6">{job.generatedDoc.summary}</p>
            <div className="prose prose-invert prose-sm max-w-none">
              <Markdown remarkPlugins={[remarkGfm]}>{job.generatedDoc.markdownPayload}</Markdown>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
