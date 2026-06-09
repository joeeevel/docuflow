import { useState, useCallback } from 'react'
import { api } from '../lib/api'

interface User {
  id: string
  email: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(false)

  const saveSession = useCallback((token: string, user: User) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setToken(token)
    setUser(user)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true)
    try {
      const res = await api.login({ email, password })
      saveSession(res.token, res.user)
      return res
    } finally {
      setLoading(false)
    }
  }, [saveSession])

  const register = useCallback(async (email: string, password: string, workspaceName: string) => {
    setLoading(true)
    try {
      const res = await api.register({ email, password, workspaceName })
      saveSession(res.token, res.user)
      return res
    } finally {
      setLoading(false)
    }
  }, [saveSession])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }, [])

  return { user, token, loading, login, register, logout, isAuthenticated: !!token }
}
