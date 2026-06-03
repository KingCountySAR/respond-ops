import type { ApiResponse } from '@shared/api'
import { useEffect, useState } from 'react'

export default function App() {
  const [status, setStatus] = useState<string>('...')

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json() as Promise<ApiResponse<{ status: string }>>)
      .then((res) => setStatus(res.data?.status ?? res.error ?? 'unknown'))
      .catch(() => setStatus('unreachable'))
  }, [])

  return (
    <main>
      <h1>Respond Ops</h1>
      <p>API status: {status}</p>
    </main>
  )
}
