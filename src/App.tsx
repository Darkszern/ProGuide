import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/routes/ProtectedRoute'

import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { Dashboard } from '@/pages/Dashboard'
import { Projects } from '@/pages/Projects'
import { ProjectDetail } from '@/pages/ProjectDetail'
import { PhaseView } from '@/pages/PhaseView'
import { NewProject } from '@/pages/NewProject'
import { Tasks } from '@/pages/Tasks'
import { CalendarPage } from '@/pages/CalendarPage'
import { Team } from '@/pages/Team'
import { Files } from '@/pages/Files'
import { SchedulePage } from '@/pages/SchedulePage'
import { Templates } from '@/pages/Templates'
import { Settings } from '@/pages/Settings'
import { Help } from '@/pages/Help'
import { NotFound } from '@/pages/NotFound'

export default function App() {
  return (
    <Routes>
      {/* Öffentliche Auth-Seiten */}
      <Route path="/login" element={<Login />} />
      <Route path="/registrieren" element={<Register />} />

      {/* Geschuetzter App-Bereich */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projekte" element={<Projects />} />
          <Route path="/projekt/neu" element={<NewProject />} />
          <Route path="/projekte/:projectId" element={<ProjectDetail />} />
          <Route path="/projekte/:projectId/phase/:phaseKey" element={<PhaseView />} />
          <Route path="/aufgaben" element={<Tasks />} />
          <Route path="/kalender" element={<CalendarPage />} />
          <Route path="/team" element={<Team />} />
          <Route path="/dateien" element={<Files />} />
          <Route path="/zeitplan" element={<SchedulePage />} />
          <Route path="/vorlagen" element={<Templates />} />
          <Route path="/einstellungen" element={<Settings />} />
          <Route path="/hilfe" element={<Help />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
