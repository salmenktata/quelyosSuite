import { Routes, Route } from 'react-router-dom'
import { SaasLayout } from './layouts/SaasLayout'
import { Dashboard } from './pages/Dashboard'

export default function App() {
  return (
    <Routes>
      <Route element={<SaasLayout />}>
        <Route index element={<Dashboard />} />
      </Route>
    </Routes>
  )
}
