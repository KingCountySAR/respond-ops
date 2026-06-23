import { Box, Typography, type SxProps, type Theme } from '@mui/material'
import { RelativeStyle, RelativeTimeText } from '@web/components/RelativeTimeText'
import { ActivityDetailRow } from '@web/store/activitiesUiStore'
import { ReactNode } from 'react'

const styles = {
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 29, borderBottom: '1px solid #eee', boxSizing: 'border-box' },
  label: { mr: 5, color: 'text.secondary', lineHeight: '28px' },
  value: { textAlign: 'right' },
} satisfies Record<string, SxProps<Theme>>

function ActivityDetailRowLayout({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box sx={styles.row}>
      <Typography variant="body2" sx={styles.label}>{label}</Typography>
      <Typography variant="body1" sx={styles.value}>{children}</Typography>
    </Box>
  )
}

function ActivityDetailValue({ row }: { row: ActivityDetailRow }) {
  if (row.type === 'time') {
    return <RelativeTimeText time={row.time} relative={RelativeStyle.Auto} />
  }

  return row.value
}

export function ActivityDetailRows({ rows }: { rows: ActivityDetailRow[] }) {
  return (
    <Box>
      {rows.map(row => (
        <ActivityDetailRowLayout key={row.label} label={row.label}>
          <ActivityDetailValue row={row} />
        </ActivityDetailRowLayout>
      ))}
    </Box>
  )
}
