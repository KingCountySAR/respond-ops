import { ThemeProvider } from '@mui/material/styles'
import { observer } from 'mobx-react-lite'
import { PropsWithChildren, StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'
import { AuthProvider, useAuthContext } from './lib/authProvider'
import { loadBootData } from './lib/bootLoader'
import { ConfigProvider, useConfigContext } from './lib/configProvider'
import { LoginPage } from './pages/LoginPage'
import { AuthStore } from './store/authStore'
import { ConfigStore } from './store/configStore'
import WebsocketStore, { SocketProvider } from './store/websocketStore'


const ObservableThemeProvider = observer(({ children }: PropsWithChildren<unknown>) => {
  const config = useConfigContext()

  return (
    <ThemeProvider theme={config.theme}>
      {children}
    </ThemeProvider>
  )
})

const AppLoginGuard = observer(({ children }: PropsWithChildren<unknown>) => {
  const auth = useAuthContext()
  if (!auth.loggedIn) {
    return <LoginPage />
  }

  return auth.loggedIn ? children : (<LoginPage />)
})

const SocketAdapter = ({ socketStore, children }: PropsWithChildren<{ socketStore: WebsocketStore }>) => {
  useEffect(() => {
    socketStore.start()
    return () => socketStore.stop()
  }, [socketStore])
  return children
}

async function boot() {
  const bootData = await loadBootData()
  const configStore = new ConfigStore(bootData.environment)
  const authStore = new AuthStore(bootData.googleClientId, bootData.login)

  const socketStore = new WebsocketStore(() => {
    const socket = new WebSocket(`${window.location.protocol === 'https:' ? 'wss://' : 'ws://'}${window.location.host}/ws`)
    return socket
  })

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ConfigProvider store={configStore}>
        <AuthProvider store={authStore}>
          <ObservableThemeProvider>
            <AppLoginGuard>
              <SocketAdapter socketStore={socketStore}>
                <SocketProvider store={socketStore}>
                  <App />
                </SocketProvider>
              </SocketAdapter>
            </AppLoginGuard>
          </ObservableThemeProvider>
        </AuthProvider>
      </ConfigProvider>
    </StrictMode>
  )
}
boot()
