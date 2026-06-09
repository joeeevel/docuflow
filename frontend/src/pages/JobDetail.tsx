import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { api, type Job } from '../lib/api'
import { Badge } from '../components/ui/Badge'
import { Pipeline } from '../components/pipeline/Pipeline'

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
  return m ? m[1] : null
}

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

  const isYoutube = job.sourceUrl.includes('youtube') || job.sourceUrl.includes('youtu.be')
  const isVideo = isYoutube || !!job.sourceUrl.match(/\.(mp4|webm|mov)$/i)
  const youtubeId = isYoutube ? extractYouTubeId(job.sourceUrl) : null

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} className="text-surface-500 hover:text-surface-300 cursor-pointer text-sm">← Back to Dashboard</button>
        <Badge status={job.status} />
      </div>

      <Pipeline status={job.status} />

      {job.status === 'failed' && job.errorLog && (
        <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
          <p className="text-xs text-red-400 font-medium mb-1">Error</p>
          <p className="text-xs text-red-300/80 font-mono whitespace-pre-wrap break-all">{job.errorLog}</p>
        </div>
      )}

      {job.generatedDoc && (
        <div className="mt-6 flex gap-6 items-start">
          {isVideo && (
            <div className="w-80 shrink-0 sticky top-8">
              <div className="glass rounded-2xl overflow-hidden">
                {youtubeId ? (
                  <div className="aspect-video">
                    <iframe
                      src={`https://www.youtube.com/embed/${youtubeId}`}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <video src={job.sourceUrl} controls className="w-full" />
                )}
              </div>
              <p className="text-xs text-surface-600 mt-2 truncate">{job.sourceUrl}</p>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="glass rounded-2xl p-8">
              <h1 className="text-2xl font-bold text-surface-100 mb-2">{job.generatedDoc.title}</h1>
              <p className="text-surface-400 text-sm mb-8 leading-relaxed">{job.generatedDoc.summary}</p>

              <div className="prose prose-invert prose-sm max-w-none
                prose-headings:text-surface-100 prose-headings:font-semibold prose-headings:mt-8 prose-headings:mb-3
                prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                prose-p:text-surface-300 prose-p:leading-relaxed prose-p:mb-4
                prose-code:text-accent-300 prose-code:bg-deep-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-xs
                prose-pre:bg-deep-800 prose-pre:border prose-pre:border-surface-800/30 prose-pre:rounded-xl prose-pre:p-4
                prose-ul:text-surface-300 prose-li:my-1
                prose-img:rounded-xl prose-img:border prose-img:border-surface-800/30 prose-img:my-6 prose-img:w-full
                prose-blockquote:border-l-accent-500/30 prose-blockquote:text-surface-400 prose-blockquote:text-xs
                [&_img]:max-h-96 [&_img]:object-contain [&_img]:bg-deep-900">
                <Markdown remarkPlugins={[remarkGfm]}>{job.generatedDoc.markdownPayload}</Markdown>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
