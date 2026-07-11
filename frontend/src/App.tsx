import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/hooks/useAuth'

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
import HelpRequestsPage from './pages/HelpRequestsPage'
import DamageAssessmentPage from './pages/DamageAssessmentPage'
import MissingPersonsPage from './pages/MissingPersonsPage'
import SupportPage from './pages/SupportPage'
import { DonationsPage } from './pages/DonationsPage'
import { FamilySafetyPage } from './pages/FamilySafetyPage'
import PublicRequestPortal from '@/pages/PublicRequestPortal'
import PublicMissingPortal from '@/pages/PublicMissingPortal'
import RiverMappingsPage from '@/pages/RiverMappingsPage'
import WaterMonitorPage from '@/pages/WaterMonitorPage'

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
  const [activeAlert, setActiveAlert] = useState<{ title: string, message: string, distance?: number } | null>(null);

  useEffect(() => {
    const socket = io('http://localhost:3001');

    socket.on('new-alert', (alert) => {
      if (!alert.latitudes || alert.latitudes.length === 0 || alert.locations?.includes('All Island')) {
        setActiveAlert({ title: alert.title, message: alert.message });
        return;
      }

      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition((position) => {
          const userLat = position.coords.latitude;
          const userLon = position.coords.longitude;
          
          let minDistance = Infinity;
          const radius = alert.broadcastRadiusKm || 20;

          for (let i = 0; i < alert.latitudes.length; i++) {
            const distance = calculateDistanceKm(userLat, userLon, alert.latitudes[i], alert.longitudes[i]);
            if (distance < minDistance) {
              minDistance = distance;
            }
          }

          if (minDistance <= radius) {
            setActiveAlert({ title: alert.title, message: alert.message, distance: minDistance });
          }
        }, (error) => {
          console.warn("Could not get location to verify alert zone.", error);
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (!activeAlert) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-10 px-4 pointer-events-none">
      <div className="bg-red-500 text-white rounded-[2rem] shadow-2xl p-6 max-w-md w-full pointer-events-auto animate-in slide-in-from-top-10 flex flex-col gap-3 border-4 border-red-400/30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl animate-pulse">🚨</div>
          <div>
            <h3 className="font-black text-lg uppercase tracking-wider">{activeAlert.title}</h3>
            {activeAlert.distance !== undefined && (
              <span className="text-[10px] bg-red-900/40 px-2.5 py-1 rounded-md font-bold mt-1 inline-block">
                📍 {activeAlert.distance.toFixed(1)}km away from you
              </span>
            )}
          </div>
        </div>
        <p className="font-bold text-sm leading-relaxed mt-2">{activeAlert.message}</p>
        <button 
          onClick={() => setActiveAlert(null)}
          className="mt-3 bg-white hover:bg-slate-100 text-red-600 font-extrabold py-3.5 rounded-xl transition-all uppercase tracking-[0.2em] text-xs w-full shadow-lg"
        >
          Acknowledge & Close
        </button>
      </div>
    </div>
  )
}

const ProtectedRoutes = () => {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" />

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

        {/* Suraksha Routes */}
        <Route path="/" element={<DashboardPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/incidents" element={<IncidentsPage />} />
        <Route path="/suraksha-alerts" element={<AlertsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/users" element={<UserManagementPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/camps" element={<CampsPage />} />
        <Route path="/tokens" element={<TokensPage />} />
        <Route path="/volunteers" element={<VolunteerPage />} />
        <Route path="/help-requests" element={<HelpRequestsPage />} />
        <Route path="/damage-assessment" element={<DamageAssessmentPage />} />
        <Route path="/missing-persons" element={<MissingPersonsPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/donations" element={<DonationsPage />} />
        <Route path="/family-safety" element={<FamilySafetyPage />} />
        <Route path="/water-monitor" element={<WaterMonitorPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/river-mappings" element={<RiverMappingsPage />} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GlobalAlertListener />
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
    </QueryClientProvider>
  )
}

export default App
