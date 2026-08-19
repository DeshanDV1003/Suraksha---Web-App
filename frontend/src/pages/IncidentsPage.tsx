import { useEffect, useState, useRef, useCallback } from 'react'
import { useDialog } from '@/components/ui/dialogs/DialogProvider'
import { Plus, Eye, Search, Clock, CheckCircle2, AlertCircle, X, MapPin, AlertTriangle, Shield, Trash2, ChevronDown as LucideChevronDown, GitMerge, FileText, Upload, Activity, Zap, Cpu, History, Loader2, Ban } from 'lucide-react'
import { cn } from '@/lib/utils'
import { IncidentLocationPicker } from '../components/map/IncidentLocationPicker'
import { incidentService, aiService } from '../services/api'

import { formatDistanceToNow, differenceInMinutes, format } from 'date-fns'
import { useAppStore } from '@/store/useAppStore'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from 'react-i18next'
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";

// Haversine formula for distance in meters
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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

  const confirmMerge = async (sourceId: string, targetId: string, linkId?: string) => {
    try {
      // Mark link as CONFIRMED before deleting the source
      if (linkId) await incidentService.resolveDuplicateLink(linkId, 'CONFIRMED').catch(() => {});
      await incidentService.deleteIncident(sourceId)
      fetchIncidents()
      addNotification({ id: Date.now().toString(), title: 'Incidents Merged', message: 'Duplicate incident successfully merged into primary record.', type: 'info', time: 'Just now', unread: true })
      setMergeCandidate(null)
    } catch (err) {
      console.error('Merge failed', err)
    }
  }

  const dismissDuplicate = async (linkId: string) => {
    try {
      await incidentService.resolveDuplicateLink(linkId, 'DISMISSED')
      fetchIncidents()
    } catch (err) {
      console.error('Dismiss failed', err)
    }
  }

  // Get the best-scoring pending duplicate link for an incident (from server data)
  const getServerDuplicate = (incident: any): { link: any; peer: any } | null => {
    // duplicateLinks: this incident is the newer (possible duplicate)
    if (incident.duplicateLinks?.length) {
      const link = incident.duplicateLinks[0];
      const peer = incidents.find(i => i.id === link.canonicalId);
      if (peer) return { link, peer };
    }
    // canonicalLinks: this incident is the primary; another report is flagged as its duplicate
    if (incident.canonicalLinks?.length) {
      const link = incident.canonicalLinks[0];
      const peer = incidents.find(i => i.id === link.reportId);
      if (peer) return { link, peer };
    }
    return null;
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
    <>
      <PageMeta title="Incidents | Suraksha" description="Suraksha Incidents Page" />
      <PageBreadcrumb pageTitle={t('page_titles.incidents')} />
      <div className="space-y-8 animate-in fade-in duration-500 font-sans pb-20 w-full min-w-0">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="suraksha-button flex items-center gap-2 group"
          >
            <div className="bg-cyan-500/20 text-cyan-400 p-1.5 rounded-lg group-hover:bg-cyan-500/30 text-cyan-300 transition-colors">
              <Plus className="w-4 h-4" />
            </div>
            {t('incidents.register_new')}
          </button>
        </div>

        {/* Filters */}
        <div className="suraksha-card p-6 flex flex-wrap gap-4 items-center bg-white dark:bg-[#131f33] border border-slate-200 dark:border-cyan-400/10">
          <div className="flex gap-4">
            <div className="relative group">
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-cyan-400/20 rounded-xl px-5 py-3 text-[11px] font-black appearance-none focus:outline-none focus:ring-2 focus:ring-[#0061ff]/10 cursor-pointer min-w-[150px] text-slate-800 dark:text-slate-100 uppercase tracking-widest"
              >
                {severities.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <LucideChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative group">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-cyan-400/20 rounded-xl px-5 py-3 text-[11px] font-black appearance-none focus:outline-none focus:ring-2 focus:ring-[#0061ff]/10 cursor-pointer min-w-[150px] text-slate-800 dark:text-slate-100 uppercase tracking-widest"
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
                  showOnlyMine ? "bg-cyan-500 text-white border-cyan-500" : "bg-slate-50 dark:bg-[#131f33] border border-slate-200 dark:border-cyan-400/20 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#0f172a]"
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

        <div className="rounded-2xl bg-white dark:bg-[#131f33] border border-slate-200 dark:border-cyan-400/10 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-cyan-400/10 bg-slate-50 dark:bg-white/[0.02]">
                  <th className="px-4 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{t('incidents.tracker_id')}</th>
                  <th className="px-4 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{t('incidents.details')}</th>
                  <th className="px-4 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 text-center">{t('incidents.priority')}</th>
                  <th className="px-4 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 text-center">{t('incidents.review_status')}</th>
                  <th className="px-4 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 text-center">Type</th>
                  <th className="px-4 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 text-center">{t('incidents.age')}</th>
                  <th className="px-4 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 text-right">{t('incidents.operations')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-cyan-400/5 font-bold">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-brand-500/20 border-t-[#0061ff] rounded-full animate-spin" />
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
                    const serverDup = getServerDuplicate(incident);
                    const duplicate = serverDup?.peer ?? null;

                    return (
                      <tr key={incident.id} className={cn("hover:bg-slate-50 dark:hover:bg-cyan-500/5 transition-all group border-l-4 border-b border-slate-100 dark:border-cyan-400/5", isSlaBreached ? "bg-red-50 dark:bg-red-500/5 border-l-red-500 hover:bg-red-100 dark:hover:bg-red-500/10" : "border-l-transparent hover:border-l-cyan-400")}>
                        <td className="px-4 py-6 text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-black">
                          #DM-{incident.id.slice(0, 6)}
                          {isSlaBreached && (
                            <div className="flex items-center gap-1 text-red-600 mt-1 animate-pulse">
                              <AlertTriangle className="w-3 h-3" /> <span className="text-[9px]">SLA BREACH</span>
                            </div>
                          )}
                          {duplicate && serverDup && (
                            <div className="flex items-center gap-1 text-amber-500 mt-1">
                              <GitMerge className="w-3 h-3" />
                              <span className="text-[9px]">POSSIBLE DUPLICATE · {serverDup.link.score}%</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-6">
                          <div className="text-base text-slate-800 dark:text-slate-100 font-black group-hover:text-brand-500 transition-colors flex items-center gap-2">
                            {incident.title}
                            {incident.severity === 'CRITICAL' && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                          </div>
                          <div className="text-[12px] text-slate-500 dark:text-slate-400 mt-1 font-bold flex items-center gap-1.5 leading-none">
                            <MapPin className="w-3 h-3 text-slate-400 dark:text-slate-300" />
                            {incident.location}
                          </div>
                        </td>
                        <td className="px-4 py-6 text-center text-sm font-bold text-slate-400">
                          <span className={cn(
                            "inline-flex items-center px-3 py-1.5 rounded-xl text-[9px] font-black tracking-[0.1em] uppercase border shadow-sm",
                            incident.severity === 'CRITICAL' ? 'bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20' :
                              incident.severity === 'HIGH' ? 'bg-orange-50 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-500/20' :
                                'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-100 dark:border-yellow-500/20'
                          )}>
                            {incident.severity}
                          </span>
                        </td>
                        <td className="px-4 py-6 text-center">
                          {isOfficer ? (
                            <select
                              value={incident.status}
                              onChange={(e) => handleUpdateStatus(incident.id, e.target.value)}
                              className={cn(
                                "px-4 py-2 rounded-xl text-[9px] font-black tracking-[0.1em] uppercase border cursor-pointer outline-none transition-all shadow-sm",
                                incident.status === 'PENDING' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-500/20' :
                                  incident.status === 'IN_PROGRESS' ? 'bg-cyan-400/10 text-cyan-600 dark:text-cyan-400 border-cyan-400/20' :
                                    incident.status === 'ASSIGNED' ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-100 dark:border-teal-500/20' :
                                      'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-100 dark:border-green-500/20'
                              )}
                            >
                              {statuses.filter(s => s !== t('incidents.all_status')).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                            </select>
                          ) : (
                            <span className={cn(
                              "px-4 py-2 rounded-xl text-[9px] font-black tracking-[0.1em] uppercase border shadow-sm",
                              incident.status === 'PENDING' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-500/20' :
                                incident.status === 'IN_PROGRESS' ? 'bg-cyan-400/10 text-cyan-600 dark:text-cyan-400 border-cyan-400/20' :
                                  incident.status === 'ASSIGNED' ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-100 dark:border-teal-500/20' :
                                    'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-100 dark:border-green-500/20'
                            )}>
                              {incident.status}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-6 text-center text-sm font-black tracking-tighter">
                          <button onClick={() => setAnalyticsCategory(incident.category)} className="bg-cyan-500/10 text-cyan-400 border-cyan-400/20 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest hover:bg-cyan-500/20 transition-colors border border-indigo-100 shadow-sm flex items-center gap-2 mx-auto">
                            <Activity className="w-3 h-3" /> {incident.category}
                          </button>
                        </td>
                        <td className="px-4 py-6 text-center text-[10px] font-black text-slate-500 dark:text-slate-400 whitespace-nowrap uppercase tracking-widest">
                          {formatDistanceToNow(new Date(incident.createdAt))}
                        </td>
                        <td className="px-4 py-6 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            {duplicate && serverDup && isOfficer && (
                              <>
                                <button
                                  onClick={() => setMergeCandidate({ source: incident, target: duplicate, link: serverDup.link })}
                                  className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 hover:bg-amber-500/20 hover:shadow-xl transition-all border border-amber-500/20"
                                  title={`Merge Duplicate (${serverDup.link.score}% match)`}
                                >
                                  <GitMerge className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => dismissDuplicate(serverDup.link.id)}
                                  className="w-10 h-10 rounded-xl bg-slate-500/10 flex items-center justify-center text-slate-400 hover:bg-slate-500/20 transition-all border border-slate-500/20"
                                  title="Dismiss — not a duplicate"
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => { setSelectedIncident(incident); setIsDetailsModalOpen(true); }}
                              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#0f172a] flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#131f33] border border-slate-200 dark:border-cyan-400/20 hover:text-brand-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all"
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
                    )
                  })
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
          <AnalyticsDrillDownModal category={analyticsCategory} incidents={incidents} onClose={() => setAnalyticsCategory(null)} />
        )}

        {/* Merge Confirmation Modal */}
        {mergeCandidate && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setMergeCandidate(null)} />
            <div className="relative w-full max-w-md bg-white dark:bg-[#131f33] border border-slate-200 dark:border-cyan-400/20 rounded-[2.5rem] shadow-2xl overflow-hidden p-8">
              <div className="flex items-center gap-4 border-b border-slate-200 dark:border-cyan-400/20 pb-4 mb-6">
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
                  <GitMerge className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Merge Incidents</h3>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Possible Duplicate Detected</p>
                </div>
              </div>
              {/* Similarity score bar */}
              {mergeCandidate.link && (
                <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Similarity Score</span>
                    <span className="text-lg font-black text-amber-400">{mergeCandidate.link.score}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700/50 rounded-full h-1.5">
                    <div className="bg-amber-400 h-1.5 rounded-full transition-all" style={{ width: `${mergeCandidate.link.score}%` }} />
                  </div>
                  {mergeCandidate.link.reasons?.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {mergeCandidate.link.reasons.map((r: string) => (
                        <span key={r} className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">{r}</span>
                      ))}
                      {mergeCandidate.link.distanceM != null && (
                        <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-400">{Math.round(mergeCandidate.link.distanceM)}m apart</span>
                      )}
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-4 mb-8">
                <div className="p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-cyan-400/20">
                  <div className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Source (Will be deleted)</div>
                  <div className="font-bold text-slate-800 dark:text-slate-100">{mergeCandidate.source.title}</div>
                </div>
                <div className="flex justify-center"><LucideChevronDown className="w-6 h-6 text-slate-300" /></div>
                <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                  <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Target (Will be kept)</div>
                  <div className="font-bold text-blue-200">{mergeCandidate.target.title}</div>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setMergeCandidate(null)} className="flex-1 px-6 py-4 rounded-2xl bg-slate-100 dark:bg-[#0f172a] text-slate-600 dark:text-slate-300 font-bold text-xs uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-cyan-400/20 transition-colors">Cancel</button>
                <button onClick={() => confirmMerge(mergeCandidate.source.id, mergeCandidate.target.id, mergeCandidate.link?.id)} className="flex-1 px-6 py-4 rounded-2xl bg-amber-500 text-white font-bold text-xs uppercase tracking-widest hover:bg-amber-600 shadow-lg shadow-amber-500/25 transition-all">Merge Records</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {incidentToDelete && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIncidentToDelete(null)} />
            <div className="relative w-full max-w-sm bg-white dark:bg-[#131f33] border border-slate-200 dark:border-cyan-400/20 rounded-[2.5rem] shadow-2xl overflow-hidden p-8 text-center">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-500/15 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">Delete Report?</h3>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-8 px-2">
                This action cannot be undone. This incident report will be permanently removed from the system.
              </p>
              <div className="flex gap-4">
                <button onClick={() => setIncidentToDelete(null)} className="flex-1 px-6 py-4 rounded-2xl bg-slate-100 dark:bg-[#0f172a] text-slate-600 dark:text-slate-300 font-bold text-xs uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-cyan-400/20 transition-colors">Cancel</button>
                <button onClick={confirmDelete} className="flex-1 px-6 py-4 rounded-2xl bg-red-500 text-white font-bold text-xs uppercase tracking-widest hover:bg-red-600 shadow-lg shadow-red-500/25 transition-all">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function CreateIncidentModal({ onClose, onSuccess }: any) {
  const { alert } = useDialog()
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
      await alert('Failed to register incident', { variant: 'danger', title: 'Registration failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="suraksha-card w-full max-w-xl max-h-[90vh] overflow-y-auto custom-scrollbar bg-white dark:bg-[#131f33] border border-slate-200 dark:border-cyan-400/20 p-8 sm:p-10 space-y-6 sm:space-y-8 animate-in slide-in-from-bottom-8 duration-500 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-6 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-brand-500">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">{t('incidents.modals.new_directive')}</h2>
              <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 italic">Emergency Resource Protocol #SR-99</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-slate-100 dark:hover:bg-[#0f172a] rounded-xl transition-colors text-slate-500 dark:text-slate-300">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            <div className="col-span-2 space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1 italic">{t('incidents.modals.directive_title')}</label>
              <input required className="suraksha-input" placeholder="Flood Alert: Region 7 Sector B" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <IncidentLocationPicker value={{ address: formData.location, latitude: formData.latitude, longitude: formData.longitude }} onChange={(loc) => { setFormData(prev => ({ ...prev, location: loc.address, latitude: loc.latitude, longitude: loc.longitude })); }} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1 italic">{t('incidents.modals.category')}</label>
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
              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1 italic">{t('incidents.modals.briefing')}</label>
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

function IncidentAIPanel({ incident }: { incident: any }) {
  const [aiData, setAiData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const analyse = useCallback(async () => {
    if (!incident?.description) return
    setLoading(true)
    try {
      const res = await aiService.analyzeReport({
        text: incident.description + ' ' + (incident.title || ''),
        latitude: incident.latitude,
        longitude: incident.longitude,
        detected_language: incident.detectedLanguage || 'en',
        language_confidence: incident.languageConfidence || 0.7,
        priority_confidence: incident.mlConfidence || 0.5,
      })
      setAiData(res.data)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [incident])

  const m = aiData?.multitask
  const u = aiData?.uncertainty

  const DECISION_STYLE: Record<string, string> = {
    AUTO_CLASSIFY: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    REQUEST_CLARIFICATION: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    ESCALATE_TO_HUMAN: 'bg-red-500/10 border-red-500/20 text-red-400',
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" /> AI Multitask Analysis
        </h3>
        <button onClick={analyse} disabled={loading}
          className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 disabled:opacity-50">
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
          {aiData ? 'Re-run' : 'Analyse'}
        </button>
      </div>

      {/* Stored ML data */}
      {!aiData && (incident.mlConfidence || incident.detectedLanguage) && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          {incident.detectedLanguage && (
            <div className="bg-white/5 rounded-xl p-2.5">
              <p className="text-[9px] text-slate-500 uppercase tracking-widest">Language</p>
              <p className="text-xs font-bold text-white/70 mt-0.5">{incident.detectedLanguage.toUpperCase()}</p>
            </div>
          )}
          {incident.mlConfidence != null && (
            <div className="bg-white/5 rounded-xl p-2.5">
              <p className="text-[9px] text-slate-500 uppercase tracking-widest">ML Confidence</p>
              <p className="text-xs font-bold text-white/70 mt-0.5">{(incident.mlConfidence * 100).toFixed(0)}%</p>
            </div>
          )}
          {incident.translatedText && (
            <div className="col-span-2 bg-blue-500/5 border border-blue-500/15 rounded-xl p-2.5">
              <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Translated (EN)</p>
              <p className="text-xs text-slate-300 line-clamp-2">{incident.translatedText}</p>
            </div>
          )}
        </div>
      )}

      {/* Full AI analysis */}
      {m && u && (
        <div className="space-y-2">
          <div className={cn('p-2.5 rounded-xl border text-[11px] font-bold', DECISION_STYLE[u.decision] || 'bg-white/5 border-white/10 text-slate-400')}>
            {u.decision_label} · {(u.calibrated_confidence * 100).toFixed(0)}% confidence
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { l: 'Type', v: m.disaster_type },
              { l: 'Urgency', v: m.urgency },
              { l: 'Resource', v: m.required_resource },
              { l: 'Vulnerable', v: m.vulnerable_group },
            ].map(item => (
              <div key={item.l} className="bg-white/5 rounded-lg p-2">
                <p className="text-[9px] text-slate-500 uppercase tracking-widest">{item.l}</p>
                <p className="text-[11px] font-bold text-white/70 mt-0.5 truncate">{item.v}</p>
              </div>
            ))}
          </div>
          {u.prediction_set && (
            <p className="text-[10px] text-slate-500">Prediction set: [{u.prediction_set.join(', ')}]</p>
          )}
        </div>
      )}

      {!aiData && !incident.mlConfidence && (
        <p className="text-[11px] text-slate-600 italic">Click Analyse to run AI multitask classification on this report.</p>
      )}
    </div>
  )
}

function FieldEvidencePanel({ incident }: { incident: any }) {
  const [images, setImages] = useState<string[]>(incident.images || [])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const allowed = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (allowed.length === 0) return
    setUploading(true)
    try {
      const base64s = await Promise.all(allowed.map(f => new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(f)
      })))
      const res = await incidentService.addImages(incident.id, base64s)
      setImages(res.data.images)
    } catch {
      /* silent — user sees no change */
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2 mb-4">
        <Upload className="w-4 h-4 text-emerald-500" /> Field Evidence
        {images.length > 0 && <span className="text-[10px] font-bold text-slate-400 normal-case tracking-normal">({images.length} photo{images.length !== 1 ? 's' : ''})</span>}
      </h3>

      {/* Drop zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); processFiles(e.dataTransfer.files) }}
        className={cn(
          'border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all',
          dragOver
            ? 'border-emerald-400 bg-emerald-500/10'
            : 'border-slate-200 dark:border-slate-600 hover:border-emerald-400/60 hover:bg-emerald-500/5'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => processFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <span className="text-xs font-bold text-slate-400">Uploading…</span>
          </div>
        ) : (
          <>
            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <Upload className="w-5 h-5 text-slate-400 dark:text-slate-300" />
            </div>
            <div className="text-xs font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest mb-1">
              {dragOver ? 'Drop to upload' : 'Click or drag & drop photos'}
            </div>
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500">JPG, PNG, WEBP — AI will auto-tag evidence</div>
          </>
        )}
      </div>

      {/* Uploaded photos grid */}
      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {images.map((src, i) => (
            <div key={i} className="relative group rounded-2xl overflow-hidden shadow-sm aspect-video bg-slate-100 dark:bg-slate-800">
              <img src={src} className="w-full h-full object-cover" alt={`Evidence ${i + 1}`} />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6">
                <div className="flex gap-1 flex-wrap">
                  <span className="bg-blue-500/80 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded backdrop-blur-sm">Photo {i + 1}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
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
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="suraksha-card w-full max-w-5xl bg-white dark:bg-[#131f33] border border-slate-200 dark:border-cyan-400/20 p-0 overflow-hidden animate-in zoom-in-95 duration-500 shadow-2xl rounded-[3rem]">
        <div className="grid grid-cols-1 md:grid-cols-2 h-full min-h-[600px] max-h-[90vh]">
          {/* Info Side */}
          <div className="p-8 md:p-10 space-y-8 flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/20 px-3 py-1.5 rounded-full uppercase tracking-widest">Incident Profile #{incident.id.slice(0, 8)}</span>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-[#0f172a] rounded-xl md:hidden text-slate-500 dark:text-slate-400"><X className="w-6 h-6" /></button>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 leading-[1.1]">{incident.title}</h2>
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold">
                <MapPin className="w-5 h-5 text-brand-500" /> {incident.location}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="space-y-1">
                <div className="text-[9px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-[0.2em]">Priority Matrix</div>
                <div className={cn("font-black text-lg uppercase", incident.severity === 'CRITICAL' ? 'text-red-600' : 'text-orange-500')}>{incident.severity}</div>
              </div>
              <div className="w-px h-10 bg-gray-100 dark:bg-gray-800" />
              <div className="space-y-1">
                <div className="text-[9px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-[0.2em]">Response Status</div>
                <div className="font-black text-slate-800 dark:text-slate-100 text-lg uppercase">{incident.status}</div>
              </div>
            </div>

            {/* AI Recommendation Engine */}
            {incident.status === 'PENDING' && (
              <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Cpu className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="text-xs font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-widest">AI Dispatch Recommendation</h4>
                </div>
                <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300 mb-4">{aiRecommendation}</p>
                <div className="flex gap-2">
                  <button className="flex-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl hover:bg-indigo-700 transition-colors">One-Click Dispatch</button>
                  <button className="px-4 bg-slate-100 dark:bg-[#131f33] border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-colors">Modify</button>
                </div>
              </div>
            )}

            <div className="space-y-3 flex-1">
              <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest italic">{t('incidents.modals.briefing')}</div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-bold text-sm bg-slate-50 dark:bg-[#0f172a] p-6 rounded-3xl border border-dashed border-slate-200 dark:border-gray-700">
                {incident.description || 'No detailed briefing provided for this incident record. Please coordinate with field officers for live updates.'}
              </p>
            </div>
          </div>

          {/* Activity / Uploads Side */}
          <div className="relative bg-slate-50 dark:bg-[#0f172a] border-l border-slate-200 dark:border-cyan-400/20 p-8 md:p-10 flex flex-col overflow-y-auto">
            <button onClick={onClose} className="absolute top-8 right-8 p-3 bg-white dark:bg-[#131f33] border border-slate-200 dark:border-cyan-400/20 rounded-2xl shadow-sm hover:bg-slate-100 dark:hover:bg-[#0f172a] transition-all text-slate-500 dark:text-slate-400 hidden md:block z-10"><X className="w-5 h-5" /></button>

            {/* Timeline Audit Log */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-6 pr-12">
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2"><History className="w-4 h-4 text-blue-500" /> Audit Log</h3>
                <button className="text-[9px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest hover:underline flex items-center gap-1"><FileText className="w-3 h-3" /> Export PDF</button>
              </div>
              <div className="relative pl-6 space-y-6 before:absolute before:inset-y-0 before:left-[11px] before:w-0.5 before:bg-gray-200 before:dark:bg-gray-700">
                {history.map((item, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[30px] w-4 h-4 rounded-full border-4 border-white dark:border-[#0f172a] bg-blue-500 shadow-sm" />
                    <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{format(item.time, 'MMM d, HH:mm')} - {item.user}</div>
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-1">{item.action}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Multitask Analysis */}
            <IncidentAIPanel incident={incident} />

            {/* Field Photo Upload */}
            <FieldEvidencePanel incident={incident} />
          </div>
        </div>
      </div>
    </div>
  )
}

const CATEGORY_RESOURCE_DEFAULTS: Record<string, string> = {
  FLOOD: 'Rescue Boats', FIRE: 'Fire Engines', MEDICAL: 'Ambulances',
  LANDSLIDE: 'Excavators', STORM: 'Emergency Shelters', MEDICAL_EMERGENCY: 'Ambulances',
}

function AnalyticsDrillDownModal({ category, incidents, onClose }: {
  category: string
  incidents: any[]
  onClose: () => void
}) {
  const now = new Date()
  const catIncidents = incidents.filter(i => i.category === category)

  // Total this month
  const totalThisMonth = catIncidents.filter(i => {
    const d = new Date(i.createdAt)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  // Avg resolution time (hours) for RESOLVED incidents that have updatedAt
  const resolved = catIncidents.filter(i => i.status === 'RESOLVED' && i.updatedAt)
  const avgResolutionHrs = resolved.length > 0
    ? resolved.reduce((sum, i) => {
        const ms = new Date(i.updatedAt).getTime() - new Date(i.createdAt).getTime()
        return sum + ms / 3_600_000
      }, 0) / resolved.length
    : null

  // Most common needed resource — prefer ML field, fall back to category default
  const resourceCounts: Record<string, number> = {}
  catIncidents.forEach(i => {
    const r = i.requiredResource || i.required_resource || i.resourceNeeds
    if (r) resourceCounts[r] = (resourceCounts[r] || 0) + 1
  })
  const commonResource = Object.keys(resourceCounts).length > 0
    ? Object.entries(resourceCounts).sort((a, b) => b[1] - a[1])[0][0]
    : CATEGORY_RESOURCE_DEFAULTS[category] || 'Emergency Units'

  // 7-day trend — last 7 actual calendar days
  const trendData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() - (6 - i))
    const label = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]
    const freq = catIncidents.filter(inc => {
      const incDate = new Date(inc.createdAt)
      return incDate.toDateString() === d.toDateString()
    }).length
    return { name: label, freq }
  })

  // Severity breakdown for this category
  const severityBreakdown = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => ({
    name: sev,
    count: catIncidents.filter(i => i.severity === sev).length,
  })).filter(s => s.count > 0)

  const severityColor: Record<string, string> = {
    CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#22c55e',
  }

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#131f33] border border-slate-200 dark:border-cyan-400/20 rounded-[2.5rem] shadow-2xl p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
              <Activity className="w-6 h-6 text-indigo-500" /> {category} Analytics
            </h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Historical Frequency & Resource Drill-Down</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-[#0f172a] rounded-xl transition-colors text-slate-500 dark:text-slate-400"><X className="w-6 h-6" /></button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-50 dark:bg-[#0f172a] p-5 rounded-3xl border border-slate-200 dark:border-cyan-400/20">
            <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Avg Resolution Time</div>
            {avgResolutionHrs !== null
              ? <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{avgResolutionHrs.toFixed(1)} <span className="text-sm text-slate-400">hrs</span></div>
              : <div className="text-sm font-bold text-slate-400 mt-1">No resolved yet</div>
            }
          </div>
          <div className="bg-slate-50 dark:bg-[#0f172a] p-5 rounded-3xl border border-slate-200 dark:border-cyan-400/20">
            <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Common Resource</div>
            <div className="text-lg font-black text-indigo-500 dark:text-indigo-400 mt-1 leading-tight">{commonResource}</div>
          </div>
          <div className="bg-slate-50 dark:bg-[#0f172a] p-5 rounded-3xl border border-slate-200 dark:border-cyan-400/20">
            <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Total This Month</div>
            <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{totalThisMonth}</div>
            {catIncidents.length !== totalThisMonth && (
              <div className="text-[10px] text-slate-400 mt-1">{catIncidents.length} all-time</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">7-Day Incident Frequency</h3>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.15)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} dx={-10} allowDecimals={false} />
                  <RechartsTooltip
                    cursor={{ stroke: 'rgba(148,163,184,0.3)', strokeWidth: 2 }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: 12, fontWeight: 'bold' }}
                    formatter={(v: any) => [v, 'Incidents']}
                  />
                  <Line type="monotone" dataKey="freq" stroke="#4f46e5" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: '#4f46e5' }} activeDot={{ r: 6, stroke: '#4f46e5', strokeWidth: 2, fill: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Severity Mix</h3>
            {severityBreakdown.length > 0 ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <BarChart data={severityBreakdown} layout="vertical" barSize={14}>
                    <XAxis type="number" hide allowDecimals={false} />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} width={56} />
                    <RechartsTooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', fontSize: 11, fontWeight: 'bold' }}
                      formatter={(v: any) => [v, 'incidents']}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                      {severityBreakdown.map(entry => (
                        <Cell key={entry.name} fill={severityColor[entry.name] || '#6366f1'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center text-[11px] text-slate-400 font-bold">No data</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
