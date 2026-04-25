import { useEffect, useState } from 'react'
import { 
  AlertTriangle, Users, Clock, Heart, Package, LayoutGrid, 
  TrendingUp, TrendingDown, Download, Filter, MapPin, 
  Building2, ChevronRight, Plus, X, Send
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { incidentService, alertService, campService, volunteerService, helpRequestService, assessmentService } from '../services/api'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '@/hooks/useAuth'

export default function DashboardPage() {
  const { user } = useAuth()
  const [incidents, setIncidents] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [camps, setCamps] = useState<any[]>([])
  const [volunteersCount, setVolunteersCount] = useState(0)
  const [helpRequestsCount, setHelpRequestsCount] = useState(0)
  const [missingCount, setMissingCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Modal states
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false)
  const [newAlert, setNewAlert] = useState({ title: '', message: '', location: '', type: 'INFO' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchData = async () => {
    try {
      const [incRes, alertRes, campRes, volRes, helpRes, missingRes] = await Promise.all([
        incidentService.getIncidents(),
        alertService.getAlerts(),
        campService.getCamps(),
        volunteerService.listVolunteers(),
        helpRequestService.getRequests(),
        assessmentService.getMissing()
      ])
      setIncidents(incRes.data)
      setAlerts(alertRes.data)
      setCamps(campRes.data)
      setVolunteersCount(volRes.data.length)
      setHelpRequestsCount(helpRes.data.length)
      setMissingCount(missingRes.data.length)
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
      label: 'Active Incidents',
      value: incidents.filter(i => i.status !== 'RESOLVED').length.toString(),
      trend: '+3',
      isUp: true,
      icon: AlertTriangle,
      color: 'text-red-500',
      blob: 'bg-red-400'
    },
    {
      label: 'Volunteers Active',
      value: volunteersCount.toString(),
      trend: '+12',
      isUp: true,
      icon: Users,
      color: 'text-green-600',
      blob: 'bg-green-400'
    },
    {
      label: 'Relief Camps',
      value: camps.length.toString(),
      trend: '+2',
      isUp: true,
      icon: Building2,
      color: 'text-purple-600',
      blob: 'bg-purple-400'
    },
    {
      label: 'Help Requests',
      value: helpRequestsCount.toString(),
      trend: '+5',
      isUp: true,
      icon: Heart,
      color: 'text-pink-600',
      blob: 'bg-pink-400'
    },
    {
      label: 'Avg Response Time',
      value: '14m',
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
      value: '842',
      subtext: '245 marked safe in last 24h',
      icon: Heart,
      color: 'bg-pink-500',
      cardClass: 'bg-[#fff5f7] border-[#fee2e7]',
      footerColor: 'text-pink-600'
    },
    {
      label: 'Community Resources',
      value: '80',
      subtext: '23 boats, 15 vehicles available',
      icon: Package,
      color: 'bg-green-500',
      cardClass: 'bg-[#f0fdf4] border-[#dcfce7]',
      footerColor: 'text-green-600'
    },
    {
      label: 'Token Distributions',
      value: '1,245',
      subtext: '23 duplicates prevented',
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1e293b]">Dashboard</h1>
          <p className="text-slate-500 mt-1 font-medium">Real-time disaster management overview</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all active:scale-95 shadow-sm">
            <Download className="w-4 h-4" />
            Export Report
          </button>
          <button
            onClick={() => setIsAlertModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#0061ff] text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/25 hover:scale-[1.02] transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New Broadcast
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ML Priority Queue */}
        <div className="lg:col-span-2 suraksha-card p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-[#1e293b]">ML-Sorted Priority Queue</h3>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors text-slate-600 font-bold text-xs uppercase tracking-wider border border-slate-100">
              <Filter className="w-4 h-4" />
              Filter Results
            </button>
          </div>

          <div className="space-y-4">
            {incidents.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <p className="text-slate-400 font-bold">No active incidents reported</p>
              </div>
            ) : (
              incidents.slice(0, 5).map((item, idx) => (
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

        {/* Recent Alerts Widget */}
        <div className="suraksha-card p-8 bg-gradient-to-b from-white to-slate-50/50">
          <h3 className="text-xl font-bold text-[#1e293b] mb-8">Recent Alerts</h3>
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-slate-400 text-xs font-bold uppercase">No active alerts</p>
              </div>
            ) : (
              alerts.slice(0, 3).map((alert, idx) => (
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
            View All Broadcasts
          </button>
        </div>
      </div>

      {/* GIS Impact Map Preview */}
      <div className="suraksha-card p-8">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold text-[#1e293b]">GIS Impact Map Preview</h3>
          <button className="flex items-center gap-2 text-[#0061ff] font-bold text-sm group">
            Open Full Map
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="relative h-[450px] w-full bg-[#f8fafc] rounded-[2.5rem] overflow-hidden border-8 border-white shadow-2xl flex items-center justify-center group/map">
          {/* Simulated Map Background */}
          <div className="absolute inset-0 bg-[#e0f2fe] pointer-events-none" />
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] pointer-events-none" />

          {/* Main Map Content - Visual Placeholder for full GIS integration */}
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping scale-150" />
              <div className="w-20 h-20 bg-white rounded-full shadow-2xl flex items-center justify-center relative z-10 border border-blue-50 group-hover/map:scale-110 transition-transform duration-500">
                <MapPin className="w-10 h-10 text-[#0061ff] fill-blue-50/50" />
              </div>
            </div>
            <div className="text-center px-6 py-4 bg-white/80 backdrop-blur-md rounded-2xl border border-white/50 shadow-xl">
              <div className="text-xl font-extrabold text-[#1e293b]">Dynamic GIS Coverage</div>
              <div className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">{incidents.length} incidents • 84 volunteers active</div>
            </div>
          </div>

          <div className="absolute top-[15%] left-[12%] w-6 h-6 bg-red-500 rounded-full shadow-lg shadow-red-500/50 animate-pulse border-2 border-white" />
          <div className="absolute top-[45%] right-[20%] w-8 h-8 bg-orange-500 rounded-full shadow-lg shadow-orange-500/50 border-2 border-white" />
          <div className="absolute bottom-[20%] right-[30%] w-5 h-5 bg-green-500 rounded-full shadow-lg shadow-green-500/50 border-2 border-white" />

          {/* Map Controls */}
          <div className="absolute bottom-10 left-10 p-6 bg-white/95 backdrop-blur-md rounded-3xl border border-white shadow-2xl space-y-4">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Layers</h4>
            <LayerToggle label="Incidents" color="text-red-500" checked />
            <LayerToggle label="Safe Zones" color="text-green-500" checked />
            <LayerToggle label="Volunteers" color="text-blue-500" />
          </div>
        </div>
      </div>

      {/* New Alert Modal */}
      {isAlertModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
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

function LayerToggle({ label, color, checked = false }: { label: string, color: string, checked?: boolean }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group select-none">
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
