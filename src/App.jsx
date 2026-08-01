import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ReconProvider } from './state/ReconContext.jsx'
import AppShell from './app/AppShell.jsx'
import DashboardPage from './routes/DashboardPage.jsx'
import UploadsPage from './routes/UploadsPage.jsx'
import ReportPage from './routes/ReportPage.jsx'

export default function App() {
  return (
    <ReconProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/uploads" element={<UploadsPage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ReconProvider>
  )
}
