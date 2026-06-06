import { Alert, Paper } from '@mui/material'
import { ToolbarPage } from '@web/components/ToolbarPage'
import { observer } from 'mobx-react-lite'
import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router'

class ActivityUiStore {
  constructor(readonly activityId: string) {

  }
  async load() {}
}

const _ActivityPage = observer(({ store }: { store: ActivityUiStore }) => {
  useEffect(() => {
    store.load()
  }, [store])

  return (
    <ToolbarPage>
      <Paper sx={{ p: 2 }}>

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
