import CloudIcon from '@mui/icons-material/Cloud'
import NoCloudIcon from '@mui/icons-material/CloudOff'
import ConnectingIcon from '@mui/icons-material/CloudSync'
import { Breakpoint, Container, Stack, styled } from '@mui/material'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import CssBaseline from '@mui/material/CssBaseline'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { AppMenu } from '@web/components/AppMenu'
import { LoginPanel } from '@web/components/LoginPanel'
import { useAuthContext } from '@web/lib/authProvider'
import { useConfigContext } from '@web/lib/configProvider'
import { useSocketContext } from '@web/store/websocketStore'
import { observer } from 'mobx-react-lite'
import * as React from 'react'
import { Link } from 'react-router'


const Main = styled('main')({})

const ConnectIconLookup = {
  idle: NoCloudIcon,
  connecting: ConnectingIcon,
  connected: CloudIcon,
}

const OnlineStatus = observer(() => {
  const sockets = useSocketContext()
  const Icon = ConnectIconLookup[sockets.connectState]

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <Typography variant="caption">{sockets.reconnectCountdownText}</Typography>
      <Icon fontSize="medium" />
    </Stack>
  )
})

export const ToolbarPage = observer(({ children, maxWidth }: { children: React.ReactNode; maxWidth?: false | Breakpoint }) => {
  const config = useConfigContext()
  const auth = useAuthContext()

  if (!auth.loggedIn) {
    children = <LoginPanel />
  }

  return (
    <Container maxWidth={maxWidth ?? 'md'} sx={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            <Link to="/" style={{ textDecoration: 'inherit', color: 'inherit' }}>
              {config.env.shortTitle} Check-In
            </Link>
          </Typography>
          <Typography variant="h6" noWrap component="div">
            <Stack
              direction="row"
              spacing={2}
              sx={{
                justifyContent: 'flex-end',
                alignItems: 'center',
              }}
            >
              <OnlineStatus />
            </Stack>
          </Typography>
          <AppMenu />
        </Toolbar>
      </AppBar>
      <Box className="toolbar-filler" sx={{ height: { xs: 56, sm: 64 } }} />
      <Main sx={{ py: 2, flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}>
        {children}
      </Main>
    </Container>
  )
})
