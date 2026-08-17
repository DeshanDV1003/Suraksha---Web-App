import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { DialogProvider } from '@/components/ui/dialogs/DialogProvider'

// Template Layout and Pages
import AppLayout from './layout/AppLayout'
import UserProfiles from "./pages/UserProfiles"
import Videos from "./pages/UiElements/Videos"
import Images from "./pages/UiElements/Images"
import Alerts from "./pages/UiElements/Alerts"
import Badges from "./pages/UiElements/Badges"
import Avatars from "./pages/UiElements/Avatars"
import Buttons from "./pages/UiElements/Buttons"
import LineChart from "./pages/Charts/LineChart"
import BarChart from "./pages/Charts/BarChart"
import Calendar from "./pages/Calendar"
import BasicTables from "./pages/Tables/BasicTables"
import FormElements from "./pages/Forms/FormElements"
import Blank from "./pages/Blank"
import Home from "./pages/Dashboard/Home"

// Suraksha Pages
import DashboardPage from '@/pages/DashboardPage'
import MapPage from '@/pages/MapPage'
import IncidentsPage from '@/pages/IncidentsPage'
import AlertsPage from '@/pages/AlertsPage'
import ReportsPage from '@/pages/ReportsPage'
import UserManagementPage from '@/pages/UserManagementPage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import ResourcesPage from '@/pages/ResourcesPage'
import CampsPage from '@/pages/CampsPage'
import TokensPage from '@/pages/TokensPage'
import SettingsPage from '@/pages/SettingsPage'
import VolunteerPage from './pages/VolunteerPage'
import TaskManagementPage from './pages/TaskManagementPage'
import HelpRequestsPage from './pages/HelpRequestsPage'
import DamageAssessmentPage from './pages/DamageAssessmentPage'
import MissingPersonsPage from './pages/MissingPersonsPage'
import SupportPage from './pages/SupportPage'
import { DonationsPage } from './pages/DonationsPage'
import { FamilySafetyPage } from './pages/FamilySafetyPage'
import PublicRequestPortal from '@/pages/PublicRequestPortal'
import PublicMissingPortal from '@/pages/PublicMissingPortal'
import RiverMappingsPage from '@/pages/RiverMappingsPage'
import AIResearchPage from '@/pages/AIResearchPage'
import WaterMonitorPage from '@/pages/WaterMonitorPage'
import CitizenDashboardPage from '@/pages/CitizenDashboardPage'
import HospitalDashboardPage from '@/pages/Hospital/HospitalDashboardPage'
import HospitalReferralsPage from '@/pages/Hospital/HospitalReferralsPage'
import HospitalCapacityPage from '@/pages/Hospital/HospitalCapacityPage'

import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

const queryClient = new QueryClient()

// Haversine distance calculation
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; // Distance in km
}

function GlobalAlertListener() {
  const [activeAlert, setActiveAlert] = useState<{ id: string, title: string, message: string, distance?: number } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const socket = io('http://localhost:3001');

    socket.on('new-alert', (alert) => {
      // Don't interrupt the admin on the alert management page itself
      if (window.location.pathname === '/suraksha-alerts') return;

      setDismissed(false);

      // All-island or no location data → show to everyone
      if (!alert.latitudes || alert.latitudes.length === 0 || alert.locations?.includes('All Island')) {
        setActiveAlert({ id: alert.id, title: alert.title, message: alert.message });
        return;
      }

      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLat = position.coords.latitude;
            const userLon = position.coords.longitude;
            let minDistance = Infinity;
            const radius = alert.broadcastRadiusKm || 50;
            for (let i = 0; i < alert.latitudes.length; i++) {
              const d = calculateDistanceKm(userLat, userLon, alert.latitudes[i], alert.longitudes[i]);
              if (d < minDistance) minDistance = d;
            }
            if (minDistance <= radius) {
              setActiveAlert({ id: alert.id, title: alert.title, message: alert.message, distance: minDistance });
            }
          },
          () => { /* location denied — skip zone alert, don't show to unverified users */ },
          { timeout: 5000 }
        );
      }
    });

    return () => { socket.disconnect(); };
  }, []);

  if (!activeAlert || dismissed) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] max-w-sm w-full pointer-events-auto animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="bg-red-600 text-white rounded-2xl shadow-2xl shadow-red-900/40 overflow-hidden border border-red-400/30">
        {/* top bar */}
        <div className="flex items-center gap-3 px-4 py-3 bg-red-700/50">
          <span className="text-base animate-pulse">🚨</span>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] flex-1">Emergency Alert</span>
          {activeAlert.distance !== undefined && (
            <span className="text-[9px] bg-red-900/50 px-2 py-0.5 rounded-md font-bold">
              {activeAlert.distance.toFixed(1)} km away
            </span>
          )}
          <button
            onClick={() => setDismissed(true)}
            className="w-6 h-6 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all text-white/80 hover:text-white flex-shrink-0"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        {/* body */}
        <div className="px-4 py-3">
          <h3 className="font-black text-sm leading-tight mb-1">{activeAlert.title}</h3>
          <p className="text-xs text-red-100 font-medium leading-relaxed line-clamp-3">{activeAlert.message}</p>
        </div>
        {/* action */}
        <div className="px-4 pb-3">
          <button
            onClick={async () => {
              setDismissed(true)
              // Record acknowledgement in backend so delivery stats are real
              if (activeAlert?.id) {
                const token = localStorage.getItem('token')
                if (token) {
                  fetch(`http://localhost:3001/api/alerts/${activeAlert.id}/acknowledge`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                  }).catch(() => {})
                }
              }
            }}
            className="w-full bg-white/15 hover:bg-white/25 text-white text-[10px] font-black uppercase tracking-widest py-2 rounded-xl transition-all"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  )
}

// Roles that get full admin/staff access
const STAFF_ROLES = ['ADMIN', 'DMC_OFFICER', 'FIELD_RESPONDER']
const CITIZEN_ROLES = ['CITIZEN', 'VOLUNTEER']

// Guard: redirects citizen/volunteer away from staff-only pages
function StaffOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" />
  if (CITIZEN_ROLES.includes(user.role)) return <Navigate to="/citizen-home" replace />
  if (user.role === 'HOSPITAL_STAFF') return <Navigate to="/hospital" replace />
  return <>{children}</>
}

// Guard: hospital staff only
function HospitalOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" />
  if (user.role !== 'HOSPITAL_STAFF') return <Navigate to="/" replace />
  return <>{children}</>
}

// Guard: redirects citizens (but not volunteers/staff) away
function NonCitizenOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" />
  if (user.role === 'CITIZEN') return <Navigate to="/citizen-home" replace />
  return <>{children}</>
}

const ProtectedRoutes = () => {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" />

  // Redirect root based on role
  const homeRoute = CITIZEN_ROLES.includes(user.role)
    ? <Navigate to="/citizen-home" replace />
    : user.role === 'HOSPITAL_STAFF'
    ? <Navigate to="/hospital" replace />
    : <DashboardPage />

  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Template Routes */}
        <Route path="/template-home" element={<Home />} />
        <Route path="/profile" element={<UserProfiles />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/blank" element={<Blank />} />
        <Route path="/form-elements" element={<FormElements />} />
        <Route path="/basic-tables" element={<BasicTables />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/avatars" element={<Avatars />} />
        <Route path="/badge" element={<Badges />} />
        <Route path="/buttons" element={<Buttons />} />
        <Route path="/images" element={<Images />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="/line-chart" element={<LineChart />} />
        <Route path="/bar-chart" element={<BarChart />} />

        {/* ── Root redirect by role ── */}
        <Route path="/" element={homeRoute} />

        {/* ── Citizen / Volunteer dashboard ── */}
        <Route path="/citizen-home" element={<CitizenDashboardPage />} />

        {/* ── Staff-only routes (redirect citizens away) ── */}
        <Route path="/reports"        element={<StaffOnly><ReportsPage /></StaffOnly>} />
        <Route path="/users"          element={<StaffOnly><UserManagementPage /></StaffOnly>} />
        <Route path="/resources"      element={<StaffOnly><ResourcesPage /></StaffOnly>} />
        <Route path="/donations"      element={<StaffOnly><DonationsPage /></StaffOnly>} />
        <Route path="/river-mappings" element={<StaffOnly><RiverMappingsPage /></StaffOnly>} />
        <Route path="/ai-research"    element={<StaffOnly><AIResearchPage /></StaffOnly>} />
        <Route path="/water-monitor"  element={<StaffOnly><WaterMonitorPage /></StaffOnly>} />

        {/* ── Shared routes (all authenticated roles) ── */}
        <Route path="/map"              element={<MapPage />} />
        <Route path="/incidents"        element={<IncidentsPage />} />
        <Route path="/suraksha-alerts"  element={<AlertsPage />} />
        <Route path="/camps"            element={<CampsPage />} />
        <Route path="/tokens"           element={<TokensPage />} />
        <Route path="/volunteers"       element={<VolunteerPage />} />
        <Route path="/tasks"            element={<StaffOnly><TaskManagementPage /></StaffOnly>} />
        <Route path="/help-requests"    element={<HelpRequestsPage />} />
        <Route path="/damage-assessment" element={<DamageAssessmentPage />} />
        <Route path="/missing-persons"  element={<MissingPersonsPage />} />
        <Route path="/support"          element={<SupportPage />} />
        <Route path="/family-safety"    element={<FamilySafetyPage />} />
        <Route path="/settings"         element={<SettingsPage />} />

        {/* ── Hospital staff routes ── */}
        <Route path="/hospital"           element={<HospitalOnly><HospitalDashboardPage /></HospitalOnly>} />
        <Route path="/hospital/referrals" element={<HospitalOnly><HospitalReferralsPage /></HospitalOnly>} />
        <Route path="/hospital/capacity"  element={<HospitalOnly><HospitalCapacityPage /></HospitalOnly>} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GlobalAlertListener />
      <DialogProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/request-help" element={<PublicRequestPortal />} />
            <Route path="/missing-portal" element={<PublicMissingPortal />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      </DialogProvider>
    </QueryClientProvider>
  )
}

export default App
