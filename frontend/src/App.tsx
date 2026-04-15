import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

// Pages
import DashboardPage from '@/pages/DashboardPage'
import MapPage from '@/pages/MapPage'
import IncidentsPage from '@/pages/IncidentsPage'
import AlertsPage from '@/pages/AlertsPage'
import ReportsPage from '@/pages/ReportsPage'
import UserManagementPage from '@/pages/UserManagementPage'
import LoginPage from '@/pages/LoginPage'
import ResourcesPage from '@/pages/ResourcesPage'
import CampsPage from '@/pages/CampsPage'
import TokensPage from '@/pages/TokensPage'

const queryClient = new QueryClient()

// Main App Router that handles auth state
const AppRouter = () => {
  const { user } = useAuth()

  if (!user) {
    return <LoginPage />
  }

  return (
    <BrowserRouter>
      <DashboardLayout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/incidents" element={<IncidentsPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/users" element={<UserManagementPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/camps" element={<CampsPage />} />
          <Route path="/tokens" element={<TokensPage />} />
        </Routes>
      </DashboardLayout>
    </BrowserRouter>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
