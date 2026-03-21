import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

const queryClient = new QueryClient()

import { ImpactMap } from '@/components/map/ImpactMap'
import MapPage from '@/pages/MapPage'
import IncidentsPage from '@/pages/IncidentsPage'
import ReportsPage from '@/pages/ReportsPage'
import LoginPage from '@/pages/LoginPage'

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
          <Route path="/" element={<Dashboard />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/incidents" element={<IncidentsPage />} />
          <Route path="/alerts" element={<div>Alerts Screen</div>} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/users" element={<div>Users Screen</div>} />
        </Routes>
      </DashboardLayout>
    </BrowserRouter>
  )
}

// Mock Screens (Will be moved to separate files later)
const Dashboard = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold tracking-tight">DMC Dashboard</h1>
      <div className="flex items-center gap-2">
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
          Export Report
        </button>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[ 
        { label: 'Active Incidents', value: '12', description: '+2 from last hour', trend: 'up' },
        { label: 'Volunteers Active', value: '84', description: 'Across 3 districts', trend: 'stable' },
        { label: 'Pending Alerts', value: '3', description: 'High priority', trend: 'down' },
        { label: 'Avg. Response Time', value: '14m', description: '-2m from yesterday', trend: 'down' },
      ].map((stat) => (
        <div key={stat.label} className="p-6 bg-card border rounded-xl shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-card border rounded-xl shadow-sm overflow-hidden h-96 flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-lg">Impact Map (Colombo)</h2>
          <span className="text-xs px-2 py-1 bg-accent rounded text-accent-foreground">Live View</span>
        </div>
        <div className="flex-1 relative">
          <ImpactMap />
        </div>
      </div>
      <div className="bg-card border rounded-xl shadow-sm flex flex-col h-96 overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg">Recent Alerts</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-3 text-sm pb-4 border-b last:border-0 last:pb-0">
              <div className="w-2 h-2 rounded-full bg-destructive mt-1.5 shrink-0"></div>
              <div>
                <p className="font-medium">Flash Flood Warning - Zone {i}</p>
                <p className="text-muted-foreground text-xs">Reported 12 minutes ago</p>
              </div>
            </div>
          ))}
        </div>
        <button className="p-3 text-sm text-primary font-medium hover:bg-accent transition-colors border-t">
          View all alerts
        </button>
      </div>
    </div>
  </div>
)

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
