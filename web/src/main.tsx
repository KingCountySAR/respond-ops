import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { observer } from 'mobx-react-lite'
import { PropsWithChildren, StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'
import { AuthProvider, useAuthContext } from './lib/authProvider'
import { loadBootData } from './lib/bootLoader'
import { ConfigProvider, useConfigContext } from './lib/configProvider'
import { LoginPage } from './pages/LoginPage'
import { ActivitiesProvider, ActivitiesStore } from './store/activitiesStore'
import { AuthStore } from './store/authStore'
import { ConfigStore } from './store/configStore'
import { LocationsProvider, LocationsStore } from './store/locationsStore'
import { OrganizationsProvider, OrganizationsStore } from './store/organizationStore'
import WebsocketStore, { SocketProvider } from './store/websocketStore'

const ObservableThemeProvider = observer(({ children }: PropsWithChildren<unknown>) => {
  const config = useConfigContext()

  return (
    <ThemeProvider theme={config.theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
})

const AppLoginGuard = observer(({ children }: PropsWithChildren<unknown>) => {
  const auth = useAuthContext()
  if (!auth.loggedIn) {
    return <LoginPage />
  }

  return children
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
  const organizationsStore = new OrganizationsStore()
  if (authStore.loggedIn) {
    await organizationsStore.load()
  }
  const locationsStore = new LocationsStore()
  const activitiesStore = new ActivitiesStore(authStore.user?.memberId, organizationsStore, socketStore)

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ConfigProvider store={configStore}>
        <AuthProvider store={authStore}>
          <ObservableThemeProvider>
            <AppLoginGuard>
              <SocketAdapter socketStore={socketStore}>
                <SocketProvider store={socketStore}>
                  <OrganizationsProvider store={organizationsStore}>
                    <LocationsProvider store={locationsStore}>
                      <ActivitiesProvider store={activitiesStore}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                          <App />
                        </LocalizationProvider>
                      </ActivitiesProvider>
                    </LocationsProvider>
                  </OrganizationsProvider>
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
