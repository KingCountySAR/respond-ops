import { Alert, Paper, type SxProps, type Theme } from '@mui/material'
import { ToolbarPage } from '@web/components/ToolbarPage'
import { observer } from 'mobx-react-lite'
import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router'

class ActivityUiStore {
  constructor(readonly activityId: string) {

  }
  async load() {}
}

const styles = {
  paper: { p: 2 },
} satisfies Record<string, SxProps<Theme>>

const _ActivityPage = observer(({ store }: { store: ActivityUiStore }) => {
  useEffect(() => {
    store.load()
  }, [store])

  return (
    <ToolbarPage>
      <Paper sx={styles.paper}>

      </Paper>
    </ToolbarPage>
  )
})

const ActivityPage = () => {
  const { activityId } = useParams()
  const store = useMemo(() => new ActivityUiStore(activityId ?? ''), [activityId])

  if (!activityId) {
    return (<ToolbarPage><Alert severity="error">Invalid activity id</Alert></ToolbarPage>)
  }
  return (<_ActivityPage store={store} />)
}

export default ActivityPage
