const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error || 'Request failed')
  return body
}

export const api = {
  register: (data: { email: string; password: string; workspaceName: string }) =>
    request<{ token: string; user: { id: string; email: string }; workspace: { id: string; name: string } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: { id: string; email: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  createJob: (sourceUrl: string) =>
    request<{ jobId: string }>('/jobs', {
      method: 'POST',
      body: JSON.stringify({ sourceUrl }),
    }),

  listJobs: () =>
    request<{ jobs: Job[] }>('/jobs'),

  getJob: (id: string) =>
    request<{ job: Job }>(`/jobs/${id}`),

  deleteJob: (id: string) =>
    request<{ message: string }>(`/jobs/${id}`, { method: 'DELETE' }),
}

export interface Job {
  _id: string
  workspaceId: string
  userId: string
  sourceUrl: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  errorLog?: string
  generatedDoc?: {
    title: string
    summary: string
    markdownPayload: string
    assets: Array<{ timestamp: string; storageUrl: string }>
  }
  createdAt: string
  updatedAt: string
}
