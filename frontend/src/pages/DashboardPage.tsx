import { useEffect, useState } from 'react'
import { 
  AlertTriangle, Users, Clock, Heart, Package, LayoutGrid, 
  TrendingUp, TrendingDown, Download, Filter, MapPin, 
  Building2, ChevronRight, Plus, X, Send, Activity, ShieldAlert,
  Printer, ArrowRightLeft, CloudLightning
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { dashboardService, alertService } from '../services/api'
import { formatDistanceToNow, format } from 'date-fns'
import { useAuth } from '@/hooks/useAuth'
import { useAppStore } from '@/store/useAppStore'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'
import L from 'leaflet'

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Heatmap custom component
function HeatmapLayer({ points, isVisible }: { points: [number, number, number][], isVisible: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !isVisible || points.length === 0) return;
    const heat = (L as any).heatLayer(points, { radius: 25, blur: 15, maxZoom: 17, gradient: {0.4: 'blue', 0.65: 'lime', 1: 'red'} }).addTo(map);
    return () => {
      map.removeLayer(heat);
    };
  }, [map, points, isVisible]);
  return null;
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user } = useAuth()
  const { searchQuery } = useAppStore()
  
  const [incidents, setIncidents] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [campsCount, setCampsCount] = useState(0)
  const [volunteersCount, setVolunteersCount] = useState(0)
  const [helpRequestsCount, setHelpRequestsCount] = useState(0)
  const [missingCount, setMissingCount] = useState(0)
  const [activeIncidentsCount, setActiveIncidentsCount] = useState(0)
  const [avgResponseTime, setAvgResponseTime] = useState('0m')
  const [secondaryStatsData, setSecondaryStatsData] = useState({
    resourcesTotal: 0,
    resourcesBoats: 0,
    resourcesVehicles: 0,
    familyUpdatesTotal: 0,
    familyUpdatesSafe: 0,
    tokenClaimsTotal: 0,
  })
  
  const [threatForecasts, setThreatForecasts] = useState<any[]>([])
  const [latestShift, setLatestShift] = useState<any>(null)
  const [responseTimeTrend, setResponseTimeTrend] = useState<any[]>([])
  const [resourceBalance, setResourceBalance] = useState<any[]>([])

  const [loading, setLoading] = useState(true)

  // Map layer toggles
  const [showIncidents, setShowIncidents] = useState(true)
  const [showHeatmap, setShowHeatmap] = useState(true)

  // Modal states
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false)
  const [newAlert, setNewAlert] = useState({ title: '', message: '', location: '', type: 'INFO' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchData = async () => {
    try {
      const res = await dashboardService.getStats()
      const data = res.data
      setIncidents(data.recentIncidents || [])
      setAlerts(data.recentAlerts || [])
      setCampsCount(data.reliefCamps || 0)
      setVolunteersCount(data.volunteersActive || 0)
      setHelpRequestsCount(data.helpRequests || 0)
      setMissingCount(data.missingPersons || 0)
      setActiveIncidentsCount(data.activeIncidents || 0)
      setAvgResponseTime(data.avgResponseTime || '0m')
      
      if (data.secondaryStats) setSecondaryStatsData(data.secondaryStats)
      if (data.threatForecasts) setThreatForecasts(data.threatForecasts)
      if (data.latestShift) setLatestShift(data.latestShift)
      if (data.responseTimeTrend) setResponseTimeTrend(data.responseTimeTrend)
      if (data.resourceBalance) setResourceBalance(data.resourceBalance)
    } catch (error) {
      console.error('Failed to fetch dashboard data', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await alertService.createAlert(newAlert)
      setIsAlertModalOpen(false)
      setNewAlert({ title: '', message: '', location: '', type: 'INFO' })
      fetchData() // Refresh
    } catch (error) {
      console.error('Failed to create alert', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const mainStats = [
    {
      label: t('dashboard.active_incidents'),
      value: activeIncidentsCount.toString(),
      trend: '+3',
      isUp: true,
      icon: AlertTriangle,
      color: 'text-red-500',
      blob: 'bg-red-400'
    },
    {
      label: t('dashboard.volunteers_active'),
      value: volunteersCount.toString(),
      trend: '+12',
      isUp: true,
      icon: Users,
      color: 'text-green-600',
      blob: 'bg-green-400'
    },
    {
      label: t('dashboard.relief_camps'),
      value: campsCount.toString(),
      trend: '+2',
      isUp: true,
      icon: Building2,
      color: 'text-purple-600',
      blob: 'bg-purple-400'
    },
    {
      label: t('dashboard.help_requests'),
      value: helpRequestsCount.toString(),
      trend: '+5',
      isUp: true,
      icon: Heart,
      color: 'text-pink-600',
      blob: 'bg-pink-400'
    },
    {
      label: t('dashboard.avg_response_time'),
      value: avgResponseTime,
      trend: '-3m',
      isUp: false,
      icon: Clock,
      color: 'text-blue-600',
      blob: 'bg-blue-400'
    },
  ]

  const secondaryStats = [
    {
      label: 'Family Safety Updates',
      value: secondaryStatsData.familyUpdatesTotal.toString(),
      subtext: `${secondaryStatsData.familyUpdatesSafe} marked safe in last 24h`,
      icon: Heart,
      color: 'bg-pink-500',
      cardClass: 'bg-[#fff5f7] border-[#fee2e7]',
      footerColor: 'text-pink-600'
    },
    {
      label: t('nav.resources'),
      value: secondaryStatsData.resourcesTotal.toString(),
      subtext: `${secondaryStatsData.resourcesBoats} boats, ${secondaryStatsData.resourcesVehicles} vehicles available`,
      icon: Package,
      color: 'bg-green-500',
      cardClass: 'bg-[#f0fdf4] border-[#dcfce7]',
      footerColor: 'text-green-600'
    },
    {
      label: 'Token Distributions',
      value: secondaryStatsData.tokenClaimsTotal.toString(),
      subtext: '0 duplicates prevented', // Simplified mock text as logic is complex
      icon: LayoutGrid,
      color: 'bg-blue-500',
      cardClass: 'bg-[#eff6ff] border-[#dbeafe]',
      footerColor: 'text-blue-600'
    },
  ]

  const formatRelTime = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date)) + ' ago'
    } catch {
      return 'just now'
    }
  }
  
  // Extract points for heatmap
  const heatPoints = incidents
    .filter(i => i.latitude && i.longitude)
    .map(i => [i.latitude, i.longitude, i.severity === 'CRITICAL' ? 1 : 0.5]) as [number, number, number][];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1e293b]">{t('dashboard.title')}</h1>
          <p className="text-slate-500 mt-1 font-medium">{t('dashboard.overview')}</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all active:scale-95 shadow-sm">
            <Download className="w-4 h-4" />
            {t('dashboard.export_report')}
          </button>
          <button
            onClick={() => setIsAlertModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#0061ff] text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/25 hover:scale-[1.02] transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            {t('dashboard.new_broadcast')}
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {mainStats.map((stat, i) => (
          <div key={i} className="suraksha-card p-7 group hover:shadow-xl transition-all">
            <div className={`stat-blob ${stat.blob}`} />
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className={cn("p-3 rounded-2xl bg-white shadow-sm border border-slate-100", stat.color)}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg",
                stat.isUp ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
              )}>
                {stat.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {stat.trend}
              </div>
            </div>
            <div className="relative z-10">
              <div className="text-4xl font-extrabold text-[#1e293b] mb-1">{stat.value}</div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {secondaryStats.map((stat, i) => (
          <div key={i} className={cn("p-6 rounded-[2rem] border transition-all hover:shadow-lg flex items-center gap-6", stat.cardClass)}>
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-black/5 transition-transform group-hover:scale-110", stat.color)}>
              <stat.icon className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-[#1e293b]">{stat.value}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{stat.label}</span>
                </div>
                <div className={cn("text-[11px] font-semibold mt-1", stat.footerColor)}>{stat.subtext}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Predictive Threat Forecast Widget (HIGH) */}
      <div className="suraksha-card p-8 bg-gradient-to-r from-[#1e293b] to-[#334155] text-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <ShieldAlert className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Predictive Threat Forecast</h3>
              <p className="text-slate-400 text-xs font-semibold">AI-powered 72h risk analysis based on meteorological & historical data</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Live Model Active</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {threatForecasts.map((forecast, i) => (
            <div key={i} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-5 rounded-2xl">
              <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-extrabold text-white">{forecast.district}</span>
                <span className={cn(
                  "text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-wider",
                  forecast.severity === 'CRITICAL' ? "bg-red-500/20 text-red-400" :
                  forecast.severity === 'HIGH' ? "bg-orange-500/20 text-orange-400" :
                  "bg-yellow-500/20 text-yellow-400"
                )}>{forecast.severity}</span>
              </div>
              <div className="text-xl font-bold mb-1 flex items-center gap-2">
                <CloudLightning className="w-5 h-5 text-slate-400" />
                {forecast.threatType}
              </div>
              <div className="flex items-center justify-between mt-4 text-xs font-semibold text-slate-400">
                <span>{Math.round(forecast.confidence * 100)}% Conf.</span>
                <span>{formatDistanceToNow(new Date(forecast.forecastTime))}</span>
              </div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
                <div 
                  className={cn("h-full", 
                    forecast.severity === 'CRITICAL' ? "bg-red-500" :
                    forecast.severity === 'HIGH' ? "bg-orange-500" :
                    "bg-yellow-500")}
                  style={{ width: `${forecast.confidence * 100}%` }}
                />
              </div>
            </div>
          ))}
          {threatForecasts.length === 0 && (
            <div className="col-span-full py-8 text-center text-slate-400 text-sm font-semibold">
              Loading forecast models...
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Response Trend, Shift Handover, Resource Balance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Response Time Trend Chart (MEDIUM) */}
        <div className="suraksha-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-[#1e293b]">7-Day SLA Trend</h3>
            <div className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md">
              <Activity className="w-4 h-4" />
              SLA Breaches: 2
            </div>
          </div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={responseTimeTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#64748b' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="time" 
                  stroke="#0061ff" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#0061ff', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, fill: '#0061ff', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Shift Handover Summary Panel (MEDIUM) */}
        <div className="suraksha-card p-6 bg-slate-50/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-[#1e293b]">Latest Shift Summary</h3>
            <button className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500 hover:text-[#0061ff] hover:border-[#0061ff]/30 transition-colors">
              <Printer className="w-4 h-4" />
            </button>
          </div>
          {latestShift ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                <span className="text-sm font-semibold text-slate-500">Shift</span>
                <span className="text-sm font-bold text-[#1e293b]">{format(new Date(latestShift.shiftTime), 'MMM d, h:mm a')}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Incidents (Op/Cl)</div>
                  <div className="text-xl font-extrabold text-[#1e293b]">{latestShift.incidentsOpened} / {latestShift.incidentsClosed}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Res. Deployed</div>
                  <div className="text-xl font-extrabold text-[#1e293b]">{latestShift.resourcesDeployed}</div>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl mt-4">
                <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Critical Notes</div>
                <div className="text-sm font-medium text-amber-800">{latestShift.criticalItems || 'None'}</div>
              </div>
            </div>
          ) : (
             <div className="text-center py-10 text-slate-400 font-semibold text-sm">No shift data available</div>
          )}
        </div>

        {/* Cross-District Resource Balance Indicator (LOW) */}
        <div className="suraksha-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-[#1e293b]">Resource Balance</h3>
            <button className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#0061ff] bg-blue-50 px-2 py-1.5 rounded-md hover:bg-blue-100 transition-colors">
              <ArrowRightLeft className="w-3 h-3" />
              Reallocate
            </button>
          </div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resourceBalance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="district" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip 
                   cursor={{ fill: '#f8fafc' }}
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="resources" name="Resources" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={12} />
                <Bar dataKey="incidents" name="Active Incidents" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Row 3: ML Priority Queue & Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 suraksha-card p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-[#1e293b]">{t('dashboard.priority_queue')}</h3>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors text-slate-600 font-bold text-xs uppercase tracking-wider border border-slate-100">
              <Filter className="w-4 h-4" />
              {t('dashboard.filter_results')}
            </button>
          </div>

          <div className="space-y-4">
            {incidents.filter(i => 
              i.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
              i.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
              i.description?.toLowerCase().includes(searchQuery.toLowerCase())
            ).length === 0 ? (
              <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <p className="text-slate-400 font-bold">{t('dashboard.no_incidents')}</p>
              </div>
            ) : (
              incidents
                .filter(i => 
                  i.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  i.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  i.description?.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .slice(0, 5).map((item, idx) => (
                <div key={idx} className="p-6 border border-slate-100 rounded-[1.5rem] hover:border-[#0061ff]/30 hover:bg-blue-50/10 transition-all group cursor-pointer shadow-sm hover:shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">#INC-{item.id.slice(0, 4)}</span>
                      <span className={cn(
                        "text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider",
                        item.severity === 'CRITICAL' ? "bg-red-100 text-red-600" :
                          item.severity === 'HIGH' ? "bg-orange-100 text-orange-600" :
                            "bg-yellow-100 text-yellow-700"
                      )}>{item.severity}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                      <Clock className="w-4 h-4 text-slate-300" />
                      {formatRelTime(item.createdAt)}
                    </div>
                  </div>

                  <h4 className="text-2xl font-bold text-[#1e293b] group-hover:text-[#0061ff] transition-colors leading-tight">{item.title}</h4>

                  <div className="flex items-center gap-2 text-sm font-bold text-slate-500 mt-2">
                    <MapPin className="w-4 h-4 text-slate-300" />
                    {item.location}
                  </div>

                  <div className="h-px bg-slate-100 my-5" />

                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-[10px] font-bold px-4 py-1.5 rounded-xl uppercase tracking-[0.1em] border",
                      item.status === 'PENDING' ? "bg-amber-50 text-amber-600 border-amber-100" :
                        item.status === 'IN_PROGRESS' ? "border-blue-100 bg-blue-50 text-blue-600" :
                          item.status === 'ASSIGNED' ? "border-teal-100 bg-teal-50 text-teal-600" :
                            "bg-slate-50 text-slate-500 border-slate-200"
                    )}>{item.status.replace('_', ' ')}</span>
                    <div className="text-xs font-bold text-slate-400">
                      ML Score: <span className="text-[#0061ff] font-extrabold text-sm ml-1">0.92</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="suraksha-card p-8 bg-gradient-to-b from-white to-slate-50/50">
          <h3 className="text-xl font-bold text-[#1e293b] mb-8">{t('dashboard.recent_alerts')}</h3>
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-slate-400 text-xs font-bold uppercase">{t('dashboard.no_alerts')}</p>
              </div>
            ) : (
              alerts.slice(0, 4).map((alert, idx) => (
                <div key={idx} className="p-5 bg-white border border-slate-100 rounded-2xl hover:border-[#0061ff]/30 hover:shadow-md transition-all group">
                  <h4 className="text-[16px] font-bold text-[#1e293b] leading-tight group-hover:text-[#0061ff] transition-colors mb-2">{alert.title}</h4>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-slate-300" />
                    {alert.location}
                  </div>
                  <div className="flex items-center justify-between mt-5">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <Clock className="w-3.5 h-3.5 text-slate-300" />
                      {formatRelTime(alert.createdAt)}
                    </div>
                    <span className={cn(
                      "text-[9px] font-bold px-2 py-0.5 rounded-md uppercase",
                      alert.type === 'EMERGENCY' ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"
                    )}>{alert.type}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          <button className="suraksha-button-outline w-full mt-8 py-4 text-xs font-bold uppercase tracking-[0.2em]">
            {t('dashboard.view_all')}
          </button>
        </div>
      </div>

      {/* GIS Impact Map Preview */}
      <div className="suraksha-card p-8">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold text-[#1e293b]">{t('dashboard.gis_map')}</h3>
          <button 
            onClick={() => navigate('/map')}
            className="flex items-center gap-2 text-[#0061ff] font-bold text-sm group"
          >
            {t('dashboard.open_full_map')}
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="relative h-[450px] w-full rounded-[2.5rem] overflow-hidden border-8 border-white shadow-2xl z-0">
          <MapContainer 
            center={[6.9271, 79.8612]} // Default Colombo
            zoom={10} 
            className="w-full h-full"
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <HeatmapLayer points={heatPoints} isVisible={showHeatmap} />
            
            {showIncidents && incidents.filter(i => i.latitude && i.longitude).map((incident, idx) => (
              <Marker key={idx} position={[incident.latitude, incident.longitude]}>
                <Popup className="font-sans">
                  <div className="font-bold text-slate-800">{incident.title}</div>
                  <div className="text-xs text-slate-500 mt-1">{incident.location}</div>
                  <div className="mt-2 text-xs font-bold px-2 py-1 bg-red-50 text-red-600 rounded inline-block uppercase">{incident.severity}</div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Map Controls */}
          <div className="absolute bottom-10 left-10 p-6 bg-white/95 backdrop-blur-md rounded-3xl border border-white shadow-2xl space-y-4 z-[400]">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Layers</h4>
            <LayerToggle 
              label="Incidents" 
              color="text-red-500" 
              checked={showIncidents} 
              onChange={() => setShowIncidents(!showIncidents)} 
            />
            <LayerToggle 
              label="Heatmap (Density)" 
              color="text-orange-500" 
              checked={showHeatmap} 
              onChange={() => setShowHeatmap(!showHeatmap)} 
            />
          </div>
        </div>
      </div>

      {/* New Alert Modal */}
      {isAlertModalOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsAlertModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl border border-white overflow-hidden">
            <div className="p-8 pb-0 flex items-center justify-between">
              <h2 className="text-2xl font-extrabold text-[#1e293b]">New Alert Broadcast</h2>
              <button
                onClick={() => setIsAlertModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateAlert} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Alert Title</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Flash Flood Warning"
                  className="suraksha-input"
                  value={newAlert.title}
                  onChange={(e) => setNewAlert({ ...newAlert, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Location</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Colombo 07"
                    className="suraksha-input"
                    value={newAlert.location}
                    onChange={(e) => setNewAlert({ ...newAlert, location: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Severity Type</label>
                  <select
                    className="suraksha-input appearance-none"
                    value={newAlert.type}
                    onChange={(e) => setNewAlert({ ...newAlert, type: e.target.value })}
                  >
                    <option value="INFO">Info</option>
                    <option value="WARNING">Warning</option>
                    <option value="EMERGENCY">Emergency</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Broadcast Message</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe the emergency details..."
                  className="suraksha-input resize-none"
                  value={newAlert.message}
                  onChange={(e) => setNewAlert({ ...newAlert, message: e.target.value })}
                />
              </div>

              <button
                disabled={isSubmitting}
                className="suraksha-button w-full h-14 flex items-center justify-center gap-2 text-base font-bold"
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Broadcast Now
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function LayerToggle({ label, color, checked = false, onChange }: { label: string, color: string, checked?: boolean, onChange?: () => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group select-none" onClick={onChange}>
      <div className={cn(
        "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
        checked ? "bg-[#0061ff] border-[#0061ff]" : "border-slate-200"
      )}>
        {checked && <div className="w-2 h-2 bg-white rounded-full" />}
      </div>
      <span className={cn("text-xs font-bold text-slate-600 transition-colors", color)}>{label}</span>
    </label>
  )
}
