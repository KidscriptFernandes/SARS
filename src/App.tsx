import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminGate } from './components/admin/AdminGate'
import { AdminLayout } from './components/admin/AdminLayout'
import { AdminLogin } from './pages/admin/AdminLogin'
import { AiLimits } from './pages/admin/AiLimits'
import { Audit } from './pages/admin/Audit'
import { IngestionDetail } from './pages/admin/IngestionDetail'
import { Ingestions } from './pages/admin/Ingestions'
import { Overview } from './pages/admin/Overview'
import { RuleEditor } from './pages/admin/RuleEditor'
import { Rules } from './pages/admin/Rules'
import { UserDetail } from './pages/admin/UserDetail'
import { Users } from './pages/admin/Users'
import { Home } from './pages/site/Home'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/admin/entrar" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <AdminGate>
            <AdminLayout />
          </AdminGate>
        }
      >
        <Route index element={<Overview />} />
        <Route path="utilizadores" element={<Users />} />
        <Route path="utilizadores/:id" element={<UserDetail />} />
        <Route path="alertas" element={<Rules />} />
        <Route path="alertas/nova" element={<RuleEditor />} />
        <Route path="alertas/:id" element={<RuleEditor />} />
        <Route path="ia" element={<AiLimits />} />
        <Route path="auditoria" element={<Audit />} />
        <Route path="ingestao" element={<Ingestions />} />
        <Route path="ingestao/:id" element={<IngestionDetail />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
