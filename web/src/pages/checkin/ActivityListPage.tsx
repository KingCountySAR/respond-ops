import { ToolbarPage } from '@web/components/ToolbarPage'
import { useActivitiesContext } from '@web/store/activitiesStore'
import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'

export const ActivityListPage = observer(() => {
  const activities = useActivitiesContext()

  useEffect(() => {
    activities.load()
  })

  return (
    <ToolbarPage>
      <div><strong>Mine:</strong></div>
      {activities.myCurrentActivities.map(a => (
        <div key={a.activity.id}>{a.activity.title}</div>
      ))}
      <div><strong>Missions:</strong></div>
      {activities.activeMissions.map(a => (
        <div key={a.id}>{a.title}</div>
      ))}
      <div><strong>Events:</strong></div>
      {activities.activeEvents.map(a => (
        <div key={a.id}>{a.title}</div>
      ))}
    </ToolbarPage>
  )
})
