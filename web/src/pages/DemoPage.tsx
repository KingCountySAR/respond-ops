import type { ApiResponse } from '@shared/api'
import { ToolbarPage } from '@web/components/ToolbarPage'
import { useSocketContext } from '@web/store/websocketStore'
import { useEffect, useMemo, useState } from 'react'

export default function DemoPage() {
  const [status, setStatus] = useState<string>('...')
  const [socketText, setSocketText] = useState<string>('')

  const sockets = useSocketContext()
  
  const handler = useMemo(() => ({
    onMessage(msg: { type: string }) {
      setSocketText(text => text + '\n' + JSON.stringify(msg))
    }
  }), [])

  useEffect(() => {
    sockets.on([''], handler)
    fetch('/api/health')
      .then((r) => r.json() as Promise<ApiResponse<{ status: string }>>)
      .then((res) => setStatus(res.data?.status ?? res.error ?? 'unknown'))
      .catch(() => setStatus('unreachable'))

    return () => {
      sockets.off(handler)
    }
  }, [sockets,handler])

  return (
    <ToolbarPage>
      <h1>Respond Ops</h1>
      <p>API status: {status}</p>
      <pre>{socketText}</pre>
    </ToolbarPage>
  )
}
