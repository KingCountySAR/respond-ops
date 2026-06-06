import { ActivityListPage } from './checkin/ActivityListPage'
import { buildCheckinRoutes } from './checkin/CheckinRoutes'
import DemoPage from './DemoPage'

export default [
  { path: '/', index: true, element: <ActivityListPage/> },
  { path: '/demo', element: <DemoPage/> },
  ...buildCheckinRoutes(),
]
