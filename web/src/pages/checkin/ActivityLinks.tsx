import { NearMe } from '@mui/icons-material'
import { Box, IconButton, type SxProps, type Theme } from '@mui/material'
import { Activity } from '@shared/api/activity'

const styles = {
  sartopoLogo: { width: 24, height: 24 },
} satisfies Record<string, SxProps<Theme>>

function NavigationButton({ lat, lon }: { lat?: string; lon?: string }) {
  if (!lat || !lon) return null

  return (
    <IconButton aria-label="Navigate" color="info" href={`https://www.google.com/maps/place/${lat},${lon}`} target="_blank">
      <NearMe />
    </IconButton>
  )
}

function SARTopoMapButton({ mapId }: { mapId?: string }) {
  if (!mapId) return null

  return (
    <IconButton aria-label="Map" href={`https://sartopo.com/m/${mapId}`} target="_blank">
      <Box component="img" src="/sartopo-logo.svg" alt="SARTopo Logo" sx={styles.sartopoLogo} />
    </IconButton>
  )
}

export function ActivityLinks({ activity }: { activity: Activity }) {
  return (
    <Box>
      <SARTopoMapButton mapId={activity.mapId} />
      <NavigationButton lat={activity.location.lat} lon={activity.location.lon} />
    </Box>
  )
}
