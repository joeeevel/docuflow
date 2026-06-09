import { useEffect, useRef } from 'react'

type MessageHandler = (event: string, data: unknown) => void

export function useWebSocket(token: string | null, onMessage: MessageHandler) {
  const wsRef = useRef<WebSocket | null>(null)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  useEffect(() => {
    if (!token) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const url = `${protocol}//${host}/ws?token=${token}`

    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => console.log('WebSocket connected')
    ws.onmessage = (event) => {
      try {
        const { event: ev, data } = JSON.parse(event.data)
        onMessageRef.current(ev, data)
      } catch {}
    }
    ws.onclose = () => console.log('WebSocket disconnected')

    return () => {
      ws.close()
    }
  }, [token])

  return wsRef
}
