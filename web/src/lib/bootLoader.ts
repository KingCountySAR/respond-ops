import { BootData, BootDataResult } from '@shared/api/environment'


declare global {
  interface Window {
    environmentBootConfig?: BootData
  }
}

export async function loadBootData(): Promise<BootData> {
  if (!window.environmentBootConfig) {
    const response = await fetch('/api/environment/dev')
    const json = await response.json() as BootDataResult
    window.environmentBootConfig = json.data!
  }

  return window.environmentBootConfig
}
