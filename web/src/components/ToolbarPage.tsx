import CloudIcon from '@mui/icons-material/Cloud'
import NoCloudIcon from '@mui/icons-material/CloudOff'
import ConnectingIcon from '@mui/icons-material/CloudSync'
import { Breakpoint, Container, Stack, styled, type SxProps, type Theme } from '@mui/material'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
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

const styles = {
  onlineStatus: { alignItems: 'center' },
  pageContainer: { display: 'flex', flexDirection: 'column', flex: '1 1 auto' },
  appBar: { zIndex: (theme: Theme) => theme.zIndex.drawer + 1 },
  toolbar: { display: 'flex', alignItems: 'center' },
  title: { flexGrow: 1 },
  headerActions: {
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  toolbarFiller: { height: { xs: 56, sm: 64 } },
  main: { py: 2, flex: '1 1 auto', display: 'flex', flexDirection: 'column' },
} satisfies Record<string, SxProps<Theme>>

const titleLinkStyle: React.CSSProperties = { textDecoration: 'inherit', color: 'inherit' }

const ConnectIconLookup = {
  idle: NoCloudIcon,
  connecting: ConnectingIcon,
  connected: CloudIcon,
}

const OnlineStatus = observer(() => {
  const sockets = useSocketContext()
  const Icon = ConnectIconLookup[sockets.connectState]

  return (
    <Stack direction="row" spacing={1} sx={styles.onlineStatus}>
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
    <Container maxWidth={maxWidth ?? 'md'} sx={styles.pageContainer}>
      <AppBar position="fixed" sx={styles.appBar}>
        <Toolbar sx={styles.toolbar}>
          <Typography variant="h6" noWrap component="div" sx={styles.title}>
            <Link to="/" style={titleLinkStyle}>
              {config.env.shortTitle} Check-In
            </Link>
          </Typography>
          <Typography variant="h6" noWrap component="div">
            <Stack
              direction="row"
              spacing={2}
              sx={styles.headerActions}
            >
              <OnlineStatus />
            </Stack>
          </Typography>
          <AppMenu />
        </Toolbar>
      </AppBar>
      <Box className="toolbar-filler" sx={styles.toolbarFiller} />
      <Main sx={styles.main}>
        {children}
      </Main>
    </Container>
  )
})
