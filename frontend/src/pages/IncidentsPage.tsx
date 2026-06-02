import { useEffect, useState, useRef } from 'react'
import { Plus, Eye, Search, Clock, CheckCircle2, AlertCircle, X, MapPin, AlertTriangle, Shield, Trash2, ChevronDown as LucideChevronDown, GitMerge, FileText, Upload, Activity, Zap, Cpu, History } from 'lucide-react'
import { cn } from '@/lib/utils'
import { IncidentLocationPicker } from '../components/map/IncidentLocationPicker'
import { incidentService } from '../services/api'
import { formatDistanceToNow, differenceInMinutes, format } from 'date-fns'
import { useAppStore } from '@/store/useAppStore'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from 'react-i18next'
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'

// Haversine formula for distance in meters
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

const SLA_THRESHOLDS = {
  CRITICAL: 15,
  HIGH: 30,
  MEDIUM: 120,
  LOW: 240
}

export default function IncidentsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { searchQuery, setSearchQuery, addNotification } = useAppStore()
  const [incidents, setIncidents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [severityFilter, setSeverityFilter] = useState('All Severities')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [showOnlyMine, setShowOnlyMine] = useState(false)

  const isOfficer = user?.role === 'ADMIN' || user?.role === 'DMC_OFFICER'
  const isAdmin = user?.role === 'ADMIN'

  const severities = [t('incidents.all_severities'), 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
  const statuses = [t('incidents.all_status'), 'PENDING', 'IN_PROGRESS', 'ASSIGNED', 'RESOLVED']

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState<any>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [incidentToDelete, setIncidentToDelete] = useState<string | null>(null)
  const [analyticsCategory, setAnalyticsCategory] = useState<string | null>(null)
  const [mergeCandidate, setMergeCandidate] = useState<any | null>(null)

  useEffect(() => {
    fetchIncidents()
  }, [])

  const fetchIncidents = async () => {
    try {
      const res = await incidentService.getIncidents()
      setIncidents(res.data)
    } catch (err) {
      console.error('Failed to fetch incidents', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await incidentService.updateStatus(id, status)
      fetchIncidents()
    } catch (err) {
      console.error('Failed to update status', err)
    }
  }

  const handleDeleteIncident = (id: string) => { setIncidentToDelete(id) }

  const confirmDelete = async () => {
    if (!incidentToDelete) return
    try {
      await incidentService.deleteIncident(incidentToDelete)
      fetchIncidents()
    } catch (err) {
      console.error('Failed to delete incident', err)
    } finally {
      setIncidentToDelete(null)
    }
  }

  const confirmMerge = async (sourceId: string, targetId: string) => {
    // In a real app, hit an API to merge. Here we'll delete the source to simulate.
    try {
      await incidentService.deleteIncident(sourceId)
      fetchIncidents()
      addNotification({ id: Date.now().toString(), title: 'Incidents Merged', message: 'Duplicate incident successfully merged into primary record.', type: 'info', time: 'Just now', unread: true })
      setMergeCandidate(null)
    } catch (err) {
      console.error('Merge failed', err)
    }
  }

  // Find duplicates
  const detectDuplicates = (incident: any) => {
    if (incident.status !== 'PENDING') return null;
    return incidents.find(i => 
      i.id !== incident.id && 
      i.status === 'PENDING' && 
      i.category === incident.category &&
      i.latitude && incident.latitude &&
      getDistance(i.latitude, i.longitude, incident.latitude, incident.longitude) < 500
    )
  }

  const filteredIncidents = incidents.filter(i => {
    const matchesSearch = i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSeverity = severityFilter === t('incidents.all_severities') || i.severity === severityFilter
    const matchesStatus = statusFilter === t('incidents.all_status') || i.status === statusFilter
    const matchesMine = !showOnlyMine || i.reporterId === user?.id
    return matchesSearch && matchesSeverity && matchesStatus && matchesMine
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1e293b]">{t('incidents.title')}</h1>
          <p className="text-slate-500 mt-1 font-medium">{t('incidents.pipeline')}</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="suraksha-button flex items-center gap-2 group"
        >
          <div className="bg-white/20 p-1.5 rounded-lg group-hover:bg-white/30 transition-colors">
            <Plus className="w-4 h-4" />
          </div>
          {t('incidents.register_new')}
        </button>
      </div>

      {/* Filters */}
      <div className="suraksha-card p-6 flex flex-wrap gap-4 items-center bg-white/80 backdrop-blur-sm">
        <div className="flex gap-4">
          <div className="relative group">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-slate-50 border border-slate-100 rounded-xl px-5 py-3 text-[11px] font-black appearance-none focus:outline-none focus:ring-2 focus:ring-[#0061ff]/10 cursor-pointer min-w-[150px] text-[#1e293b] uppercase tracking-widest"
            >
              {severities.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <LucideChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative group">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-100 rounded-xl px-5 py-3 text-[11px] font-black appearance-none focus:outline-none focus:ring-2 focus:ring-[#0061ff]/10 cursor-pointer min-w-[150px] text-[#1e293b] uppercase tracking-widest"
            >
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <LucideChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          {user?.role === 'CITIZEN' && (
            <button
              onClick={() => setShowOnlyMine(!showOnlyMine)}
              className={cn(
                "px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                showOnlyMine ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-400 border-slate-100 hover:bg-slate-50"
              )}
            >
              {showOnlyMine ? 'Showing My Reports' : 'Show All Reports'}
            </button>
          )}
        </div>
        <div className="ml-auto relative w-80">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          <input
            type="text"
            placeholder={t('incidents.search_placeholder')}
            className="suraksha-input pl-14"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="suraksha-card overflow-hidden shadow-2xl shadow-blue-500/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100/50">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t('incidents.tracker_id')}</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t('incidents.details')}</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">{t('incidents.priority')}</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">{t('incidents.review_status')}</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Type</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">{t('incidents.age')}</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">{t('incidents.operations')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/50 font-bold">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-[#0061ff]/20 border-t-[#0061ff] rounded-full animate-spin" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('incidents.syncing')}</span>
                    </div>
                  </td>
                </tr>
              ) : filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center text-slate-400 uppercase tracking-widest text-[11px] font-black italic">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                      <AlertCircle className="w-12 h-12" />
                      {t('incidents.no_records')}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((incident) => {
                  const minutesAge = differenceInMinutes(new Date(), new Date(incident.createdAt));
                  const isSlaBreached = incident.status === 'PENDING' && minutesAge > SLA_THRESHOLDS[incident.severity as keyof typeof SLA_THRESHOLDS];
                  const duplicate = detectDuplicates(incident);

                  return (
                  <tr key={incident.id} className={cn("hover:bg-blue-50/[0.15] transition-all group border-l-4", isSlaBreached ? "bg-red-50/30 border-l-red-500" : "border-l-transparent hover:border-l-[#0061ff]")}>
                    <td className="px-8 py-8 text-[11px] text-slate-400 uppercase tracking-widest font-black">
                      #DM-{incident.id.slice(0, 6)}
                      {isSlaBreached && (
                        <div className="flex items-center gap-1 text-red-600 mt-1 animate-pulse">
                          <AlertTriangle className="w-3 h-3" /> <span className="text-[9px]">SLA BREACH</span>
                        </div>
                      )}
                      {duplicate && (
                        <div className="flex items-center gap-1 text-amber-600 mt-1">
                          <GitMerge className="w-3 h-3" /> <span className="text-[9px]">DUPLICATE</span>
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-8">
                      <div className="text-base text-[#1e293b] font-black group-hover:text-[#0061ff] transition-colors flex items-center gap-2">
                        {incident.title}
                        {incident.severity === 'CRITICAL' && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                      </div>
                      <div className="text-[12px] text-slate-400 mt-1 font-bold flex items-center gap-1.5 leading-none">
                        <MapPin className="w-3 h-3 text-slate-300" />
                        {incident.location}
                      </div>
                    </td>
                    <td className="px-8 py-8 text-center text-sm font-bold text-slate-500">
                      <span className={cn(
                        "inline-flex items-center px-4 py-1.5 rounded-xl text-[9px] font-black tracking-[0.1em] uppercase border shadow-sm",
                        incident.severity === 'CRITICAL' ? 'bg-red-50 text-red-600 border-red-100 shadow-red-500/5' :
                          incident.severity === 'HIGH' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                            'bg-yellow-50 text-yellow-600 border-yellow-100 font-bold'
                      )}>
                        {incident.severity}
                      </span>
                    </td>
                    <td className="px-8 py-8 text-center">
                      {isOfficer ? (
                        <select
                          value={incident.status}
                          onChange={(e) => handleUpdateStatus(incident.id, e.target.value)}
                          className={cn(
                            "px-4 py-2 rounded-xl text-[9px] font-black tracking-[0.1em] uppercase border cursor-pointer outline-none transition-all shadow-sm",
                            incident.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                              incident.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                incident.status === 'ASSIGNED' ? 'bg-teal-50 text-teal-700 border-teal-100' :
                                  'bg-green-50 text-green-700 border-green-100'
                          )}
                        >
                          {statuses.filter(s => s !== t('incidents.all_status')).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                        </select>
                      ) : (
                        <span className={cn(
                          "px-4 py-2 rounded-xl text-[9px] font-black tracking-[0.1em] uppercase border shadow-sm",
                          incident.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            incident.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                              incident.status === 'ASSIGNED' ? 'bg-teal-50 text-teal-700 border-teal-100' :
                                'bg-green-50 text-green-700 border-green-100'
                        )}>
                          {incident.status}
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-8 text-center text-sm font-black tracking-tighter">
                       <button onClick={() => setAnalyticsCategory(incident.category)} className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest hover:bg-indigo-100 transition-colors border border-indigo-100 shadow-sm flex items-center gap-2 mx-auto">
                         <Activity className="w-3 h-3" /> {incident.category}
                       </button>
                    </td>
                    <td className="px-8 py-8 text-center text-[10px] font-black text-slate-400 whitespace-nowrap uppercase tracking-widest">
                      {formatDistanceToNow(new Date(incident.createdAt))}
                    </td>
                    <td className="px-8 py-8 text-right">
                      <div className="flex items-center justify-end gap-3 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                        {duplicate && isOfficer && (
                          <button
                            onClick={() => setMergeCandidate({ source: incident, target: duplicate })}
                            className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 hover:bg-amber-100 hover:shadow-xl transition-all border border-transparent"
                            title="Merge Duplicate"
                          >
                            <GitMerge className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => { setSelectedIncident(incident); setIsDetailsModalOpen(true); }}
                          className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-white hover:text-[#0061ff] hover:shadow-xl hover:shadow-blue-500/10 transition-all border border-transparent hover:border-slate-100"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteIncident(incident.id)}
                            className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 transition-all border border-transparent"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Incident Modal */}
      {isCreateModalOpen && (
        <CreateIncidentModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={(data: any) => {
            setIsCreateModalOpen(false);
            fetchIncidents();
            addNotification({
              id: Date.now().toString(),
              title: 'New Incident Logged',
              message: `Directive #SR-99: ${data.title} registered.`,
              time: 'Just now',
              type: 'incident',
              unread: true
            });
          }}
        />
      )}

      {/* Details Modal */}
      {isDetailsModalOpen && selectedIncident && (
        <IncidentDetailsModal
          incident={selectedIncident}
          onClose={() => {
            setIsDetailsModalOpen(false)
            setSelectedIncident(null)
          }}
        />
      )}

      {/* Analytics Drill Down Modal */}
      {analyticsCategory && (
        <AnalyticsDrillDownModal category={analyticsCategory} onClose={() => setAnalyticsCategory(null)} />
      )}

      {/* Merge Confirmation Modal */}
      {mergeCandidate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setMergeCandidate(null)} />
          <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-8 border border-white">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-4 mb-6">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
                <GitMerge className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800">Merge Incidents</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Duplicate Detected within 500m</p>
              </div>
            </div>
            <div className="space-y-4 mb-8">
               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                 <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Source (Will be deleted)</div>
                 <div className="font-bold text-slate-800">{mergeCandidate.source.title}</div>
               </div>
               <div className="flex justify-center"><LucideChevronDown className="w-6 h-6 text-slate-300" /></div>
               <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                 <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Target (Will be kept)</div>
                 <div className="font-bold text-blue-900">{mergeCandidate.target.title}</div>
               </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setMergeCandidate(null)} className="flex-1 px-6 py-4 rounded-2xl bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors">Cancel</button>
              <button onClick={() => confirmMerge(mergeCandidate.source.id, mergeCandidate.target.id)} className="flex-1 px-6 py-4 rounded-2xl bg-amber-500 text-white font-bold text-xs uppercase tracking-widest hover:bg-amber-600 shadow-lg shadow-amber-500/25 transition-all">Merge Records</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {incidentToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIncidentToDelete(null)} />
          <div className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-8 text-center border border-white">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">Delete Report?</h3>
            <p className="text-sm font-bold text-slate-500 mb-8 px-2">
              This action cannot be undone. This incident report will be permanently removed from the system.
            </p>
            <div className="flex gap-4">
              <button onClick={() => setIncidentToDelete(null)} className="flex-1 px-6 py-4 rounded-2xl bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 px-6 py-4 rounded-2xl bg-red-500 text-white font-bold text-xs uppercase tracking-widest hover:bg-red-600 shadow-lg shadow-red-500/25 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CreateIncidentModal({ onClose, onSuccess }: any) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    title: '', description: '', location: '', severity: 'MEDIUM', category: 'FLOOD', latitude: 6.9271, longitude: 79.8612
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    try {
      await incidentService.createIncident(formData)
      onSuccess(formData)
    } catch (err) {
      alert('Failed to register incident')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex justify-center overflow-y-auto p-4 py-8 sm:py-20 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="suraksha-card w-full max-w-xl bg-white p-8 sm:p-10 space-y-6 sm:space-y-8 animate-in slide-in-from-bottom-8 duration-500 shadow-2xl my-auto">
        <div className="flex items-center justify-between border-b border-slate-50 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#0061ff]">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#1e293b]">{t('incidents.modals.new_directive')}</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5 italic">Emergency Resource Protocol #SR-99</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-300 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            <div className="col-span-2 space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 italic">{t('incidents.modals.directive_title')}</label>
              <input required className="suraksha-input" placeholder="Flood Alert: Region 7 Sector B" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <IncidentLocationPicker value={{ address: formData.location, latitude: formData.latitude, longitude: formData.longitude }} onChange={(loc) => { setFormData(prev => ({ ...prev, location: loc.address, latitude: loc.latitude, longitude: loc.longitude })); }} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 italic">{t('incidents.modals.category')}</label>
              <div className="relative">
                <select className="suraksha-input appearance-none cursor-pointer pr-10" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                  <option value="FLOOD">Flood response</option>
                  <option value="LANDSLIDE">Landslide alert</option>
                  <option value="STORM">Storm management</option>
                  <option value="MEDICAL">Medical emergency</option>
                  <option value="FIRE">Fire hazard</option>
                </select>
                <LucideChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 italic">{t('incidents.modals.briefing')}</label>
              <textarea required className="suraksha-input min-h-[120px] py-4" placeholder="Provide detailed description of the situation, required resources, and population density at risk..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}></textarea>
            </div>
          </div>
          <button type="submit" disabled={loading} className="suraksha-button w-full h-14 uppercase tracking-widest text-[11px] font-black shadow-blue-500/30 mt-4">
            {loading ? t('incidents.modals.transmitting') : t('incidents.modals.execute')}
          </button>
        </form>
      </div>
    </div>
  )
}

function IncidentDetailsModal({ incident, onClose }: any) {
  const { t } = useTranslation()
  
  // Generate deterministic mock history
  const history = [
    { time: new Date(incident.createdAt), user: incident.reporter?.name || 'Citizen', action: 'Incident Created & Logged' },
    { time: new Date(new Date(incident.createdAt).getTime() + 15 * 60000), user: 'System AI', action: 'Auto-Assigned to Region B Command' },
    ...(incident.status !== 'PENDING' ? [{ time: new Date(new Date(incident.createdAt).getTime() + 45 * 60000), user: 'Dispatcher Officer', action: 'Status changed to IN_PROGRESS. Field units deployed.' }] : []),
    ...(incident.status === 'RESOLVED' ? [{ time: new Date(new Date(incident.createdAt).getTime() + 180 * 60000), user: 'Field Commander', action: 'Incident marked as RESOLVED. Scene cleared.' }] : []),
  ];

  const aiRecommendation = incident.severity === 'CRITICAL' ? 'Deploy 2x Heavy Rescue Teams, 1x Medevac' : 
                           incident.severity === 'HIGH' ? 'Deploy 1x Rescue Team, Local Medics' : 
                           'Deploy Local Volunteers for assessment';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="suraksha-card w-full max-w-5xl bg-white p-0 overflow-hidden animate-in zoom-in-95 duration-500 shadow-2xl rounded-[3rem]">
        <div className="grid grid-cols-1 md:grid-cols-2 h-full min-h-[600px] max-h-[90vh]">
          {/* Info Side */}
          <div className="p-8 md:p-10 space-y-8 flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full uppercase tracking-widest">Incident Profile #{incident.id.slice(0, 8)}</span>
              <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl md:hidden"><X className="w-6 h-6" /></button>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-black text-[#1e293b] leading-[1.1]">{incident.title}</h2>
              <div className="flex items-center gap-2 text-slate-500 font-bold">
                <MapPin className="w-5 h-5 text-[#0061ff]" /> {incident.location}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="space-y-1">
                <div className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Priority Matrix</div>
                <div className={cn("font-black text-lg uppercase", incident.severity === 'CRITICAL' ? 'text-red-600' : 'text-orange-500')}>{incident.severity}</div>
              </div>
              <div className="w-px h-10 bg-slate-100" />
              <div className="space-y-1">
                <div className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Response Status</div>
                <div className="font-black text-[#1e293b] text-lg uppercase">{incident.status}</div>
              </div>
            </div>

            {/* AI Recommendation Engine */}
            {incident.status === 'PENDING' && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Cpu className="w-5 h-5 text-indigo-600" />
                  <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest">AI Dispatch Recommendation</h4>
                </div>
                <p className="text-sm font-bold text-indigo-700 mb-4">{aiRecommendation}</p>
                <div className="flex gap-2">
                  <button className="flex-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl hover:bg-indigo-700 transition-colors">One-Click Dispatch</button>
                  <button className="px-4 bg-white text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-50 transition-colors border border-indigo-200">Modify</button>
                </div>
              </div>
            )}

            <div className="space-y-3 flex-1">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{t('incidents.modals.briefing')}</div>
              <p className="text-slate-600 leading-relaxed font-bold text-sm bg-slate-50 p-6 rounded-3xl border border-dashed border-slate-200">
                {incident.description || 'No detailed briefing provided for this incident record. Please coordinate with field officers for live updates.'}
              </p>
            </div>
          </div>

          {/* Activity / Uploads Side */}
          <div className="relative bg-slate-50 border-l border-slate-100 p-8 md:p-10 flex flex-col overflow-y-auto">
            <button onClick={onClose} className="absolute top-8 right-8 p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:bg-slate-50 transition-all text-slate-400 hidden md:block z-10"><X className="w-5 h-5" /></button>
            
            {/* Timeline Audit Log */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><History className="w-4 h-4 text-blue-500" /> Audit Log</h3>
                <button className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1"><FileText className="w-3 h-3" /> Export PDF</button>
              </div>
              <div className="relative pl-6 space-y-6 before:absolute before:inset-y-0 before:left-[11px] before:w-0.5 before:bg-slate-200">
                {history.map((item, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[30px] w-4 h-4 rounded-full border-4 border-white bg-blue-500 shadow-sm" />
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{format(item.time, 'MMM d, HH:mm')} - {item.user}</div>
                    <div className="text-sm font-bold text-slate-700 mt-1">{item.action}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Field Photo Upload */}
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4"><Upload className="w-4 h-4 text-emerald-500" /> Field Evidence</h3>
              <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center hover:bg-white transition-colors cursor-pointer group">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5 text-slate-400" />
                </div>
                <div className="text-xs font-black text-slate-600 uppercase tracking-widest mb-1">Drag & Drop Photos</div>
                <div className="text-[10px] font-bold text-slate-400">AI will auto-tag uploaded evidence</div>
              </div>

              {/* Mock Uploaded Photos */}
              {incident.images && incident.images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="relative group rounded-2xl overflow-hidden shadow-sm">
                    <img src={incident.images[0]} className="w-full h-32 object-cover" alt="Evidence" />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                      <div className="flex gap-1">
                         <span className="bg-blue-500/80 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded backdrop-blur-sm">Flood Damage</span>
                         <span className="bg-red-500/80 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded backdrop-blur-sm">Structural</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AnalyticsDrillDownModal({ category, onClose }: { category: string, onClose: () => void }) {
  // Mock Data for Analytics
  const mockTrendData = [
    { name: 'Mon', freq: 4 }, { name: 'Tue', freq: 7 }, { name: 'Wed', freq: 3 },
    { name: 'Thu', freq: 12 }, { name: 'Fri', freq: 8 }, { name: 'Sat', freq: 5 }, { name: 'Sun', freq: 9 }
  ];
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-white rounded-[2.5rem] shadow-2xl p-8 border border-white">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <Activity className="w-6 h-6 text-indigo-500" /> {category} Analytics
            </h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Historical Frequency & Resource Drill-Down</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"><X className="w-6 h-6" /></button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg Resolution Time</div>
             <div className="text-2xl font-black text-slate-800">4.2 <span className="text-sm text-slate-500">hrs</span></div>
          </div>
          <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Common Resource</div>
             <div className="text-lg font-black text-indigo-600 mt-1">Rescue Boats</div>
          </div>
          <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total This Month</div>
             <div className="text-2xl font-black text-slate-800">142</div>
          </div>
        </div>

        <div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">7-Day Incident Frequency</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} dx={-10} />
                <RechartsTooltip 
                  cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="freq" stroke="#4f46e5" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, stroke: '#4f46e5', strokeWidth: 2, fill: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
