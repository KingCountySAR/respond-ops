import { PropsWithChildren, Suspense } from 'react'

export const LoadingUI = ({ children }: PropsWithChildren<unknown>) => (
  <Suspense fallback={<div>Loading UI...</div>}>{children}</Suspense>
)
