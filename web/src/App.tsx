import { observer } from 'mobx-react-lite'
import { createBrowserRouter, RouterProvider } from 'react-router'

import { useAuthContext } from './lib/authProvider'
import { LoginPage } from './pages/LoginPage'
import routes from './pages/Routes'

const router = createBrowserRouter([
  ...routes
])

const App = observer(() => {
  const auth = useAuthContext()
  return auth.loggedIn ? <RouterProvider router={router}/> : <LoginPage />
})

export default App
