import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Clock, MapPin, Users, Loader2, Navigation, MessageSquare, CheckCircle2, AlertCircle, Smartphone } from 'lucide-react'
import { helpRequestService, volunteerService } from '@/services/api'
import { cn } from '@/lib/utils'
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";

export default function HelpRequestsPage() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<any[]>([])
  const [clusters, setClusters] = useState<any[]>([])
  const [volunteers, setVolunteers] = useState<any[]>([])

  const [activeTab, setActiveTab] = useState('dispatch')
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const [assignSelections, setAssignSelections] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null)

  const [smsPayload, setSmsPayload] = useState('HELP Rescue Flooded house near Main St 4')
  const [smsResponse, setSmsResponse] = useState('')

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      await helpRequestService.checkEscalations()

      const [reqRes, clusRes, volRes] = await Promise.all([
        helpRequestService.getRequests(),
        helpRequestService.getClusters(),
        volunteerService.listVolunteers()
      ])

      setRequests(reqRes.data)
      setClusters(clusRes.data)
      // Show all volunteers — if no active check-in, still show them (they can still be assigned)
      setVolunteers(volRes.data)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleAssign = async (reqId: string) => {
    const volId = assignSelections[reqId]
    if (!volId) return showToast('Select a responder first', 'error')
    try {
      setAssigningId(reqId)
      await helpRequestService.assignResponder(reqId, volId)
      showToast('Responder dispatched successfully')
      fetchData()
    } catch {
      showToast('Failed to assign responder', 'error')
    } finally {
      setAssigningId(null)
    }
  }

  const handleStatusUpdate = async (reqId: string, status: string) => {
    try {
      await helpRequestService.updateStatus(reqId, status)
      fetchData()
    } catch {
      showToast('Failed to update status', 'error')
    }
  }

  const simulateSms = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSmsResponse('Sending...')
      const res = await helpRequestService.mockSmsWebhook({ From: '+94770000000', Body: smsPayload })
      setSmsResponse(res.data)
      fetchData()
    } catch {
      setSmsResponse('Failed to send SMS.')
    }
  }

  if (loading && requests.length === 0) {
    return (
      <>
        <PageMeta title={`${t('nav.help_requests')} | Suraksha`} description="Suraksha Help Requests Page" />
        <PageBreadcrumb pageTitle={t('nav.help_requests')} />
        <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-red-400" /></div>
      </>
    )
  }

  const activeVolunteers = volunteers.filter(v => v.volunteerProfile?.checkIns?.some((c: any) => !c.checkOutTime))
  const allVolunteers = volunteers

  return (
    <>
      <PageMeta title={`${t('nav.help_requests')} | Suraksha`} description="Suraksha Help Requests Page" />
      <PageBreadcrumb pageTitle={t('nav.help_requests')} />
      <div className="space-y-8 animate-in fade-in duration-500 font-sans pb-10 w-full min-w-0">
        <div className="mb-2">
          <p className="text-slate-400 font-medium">{t('help_requests_page.subtitle')}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-slate-100 dark:bg-[#131f33] p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-cyan-400/10">
          {[
            { id: 'dispatch', label: t('help_requests_page.tabs.dispatch_queue'), icon: Navigation },
            { id: 'map', label: t('help_requests_page.tabs.clustered_hotspots'), icon: MapPin },
            { id: 'sms', label: t('help_requests_page.tabs.sms_intake'), icon: Smartphone }
          ].map(tab => (
            <button
              key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all",
                activeTab === tab.id
                  ? "bg-red-500/80 text-white shadow-md"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-200"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'dispatch' && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Queue */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-black text-slate-800 dark:text-white/90">{t('help_requests_page.pending_requests')}</h2>

              {requests.filter(r => r.status === 'PENDING').length === 0 && (
                <div className="p-8 text-center bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 text-slate-400">
                  {t('help_requests_page.no_pending')}
                </div>
              )}

              {requests.filter(r => r.status === 'PENDING').map(req => (
                <div key={req.id} className={cn(
                  "suraksha-card p-6 rounded-[1.5rem] relative overflow-hidden transition-all",
                  req.escalationLevel === 'CRITICAL' ? 'border-2 border-red-500 ring-4 ring-red-500/20' :
                  req.escalationLevel === 'HIGH' ? 'border-2 border-orange-500 ring-4 ring-orange-500/20' : ''
                )}>
                  {req.escalationLevel !== 'NONE' && (
                    <div className="absolute top-0 left-0 right-0 bg-red-600 text-white text-xs font-black text-center py-1 animate-pulse uppercase tracking-widest">
                      {t('help_requests_page.escalated')}
                    </div>
                  )}

                  <div className={cn("flex justify-between items-start", req.escalationLevel !== 'NONE' ? 'mt-4' : '')}>
                    <div className="flex gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                        req.priority === 'CRITICAL' ? 'bg-red-500/15 text-red-400' :
                        req.priority === 'HIGH' ? 'bg-orange-500/15 text-orange-400' : 'bg-blue-500/15 text-blue-400'
                      )}>
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-lg text-slate-800 dark:text-white/90">{req.type}</h3>
                          <span className={cn(
                            "text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wider",
                            req.priority === 'CRITICAL' ? 'bg-red-600 text-white' :
                            req.priority === 'HIGH' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'
                          )}>
                            {req.priority}
                          </span>
                        </div>
                        <p className="text-slate-400 font-medium mt-1">{req.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-6 p-4 bg-slate-50 dark:bg-white/5 rounded-xl">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm font-bold">
                      <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="truncate">{req.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm font-bold">
                      <Users className="w-4 h-4 text-slate-500 shrink-0" />
                      {req.peopleCount || 1} {t('help_requests_page.people')}
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm font-bold">
                      <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                      {Math.floor((new Date().getTime() - new Date(req.createdAt).getTime()) / 60000)} {t('help_requests_page.mins_ago')}
                    </div>
                  </div>

                  <div className="mt-6 flex items-center gap-3">
                    <select
                      className="suraksha-input flex-1 cursor-pointer"
                      value={assignSelections[req.id] || ''}
                      onChange={e => setAssignSelections(prev => ({ ...prev, [req.id]: e.target.value }))}
                    >
                      <option value="">{t('help_requests_page.select_responder')}</option>
                      {activeVolunteers.length > 0 && (
                        <optgroup label={`— ${t('help_requests_page.active_on_duty')}`}>
                          {activeVolunteers.map(v => (
                            <option key={v.id} value={v.id}>{v.name} ✓ {t('help_requests_page.active_on_duty')}</option>
                          ))}
                        </optgroup>
                      )}
                      <optgroup label={`— ${t('help_requests_page.all_volunteers')}`}>
                        {allVolunteers.map(v => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </optgroup>
                    </select>
                    <button
                      disabled={assigningId === req.id || !assignSelections[req.id]}
                      onClick={() => handleAssign(req.id)}
                      className="bg-brand-500 text-white px-6 py-3 rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-cyan-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {assigningId === req.id ? <Loader2 className="w-4 h-4 animate-spin"/> : t('help_requests_page.dispatch')}
                    </button>
                  </div>

                  {/* Escalation Audit Trail */}
                  {req.escalations?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-red-500/20 space-y-2">
                      <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">{t('help_requests_page.escalation_audit_log')}</p>
                      {req.escalations.map((esc: any) => (
                        <p key={esc.id} className="text-xs font-medium text-red-400 bg-red-500/10 p-2 rounded-lg">
                          <span className="font-bold opacity-70">[{new Date(esc.triggeredAt).toLocaleTimeString()}]</span> {esc.message}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Active Operations Sidebar */}
            <div className="space-y-4">
              <h2 className="text-xl font-black text-slate-800 dark:text-white/90">{t('help_requests_page.active_operations')}</h2>
              <div className="bg-slate-100 dark:bg-[#0a1628] rounded-[1.5rem] p-6 space-y-4 shadow-xl border border-slate-200 dark:border-white/10">
                {requests.filter(r => ['ASSIGNED', 'EN_ROUTE', 'ON_SITE'].includes(r.status)).length === 0 && (
                  <p className="text-slate-500 text-sm text-center">{t('help_requests_page.no_active_ops')}</p>
                )}
                {requests.filter(r => ['ASSIGNED', 'EN_ROUTE', 'ON_SITE'].includes(r.status)).map(req => (
                  <div key={req.id} className="bg-white dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                    <h4 className="font-bold text-slate-800 dark:text-white/90 mb-1">{req.type} — {req.location}</h4>
                    <p className="text-xs text-slate-400 mb-4">{t('help_requests_page.priority')} <span className={req.priority === 'CRITICAL' ? 'text-red-400' : req.priority === 'HIGH' ? 'text-orange-400' : 'text-blue-400'}>{req.priority}</span></p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusUpdate(req.id, 'EN_ROUTE')}
                        className={cn("flex-1 text-[10px] font-bold py-2 rounded uppercase tracking-wider transition-all", req.status === 'EN_ROUTE' ? "bg-blue-500 text-white" : "bg-slate-100 dark:bg-white/8 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/15")}
                      >
                        {t('help_requests_page.en_route')}
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(req.id, 'ON_SITE')}
                        className={cn("flex-1 text-[10px] font-bold py-2 rounded uppercase tracking-wider transition-all", req.status === 'ON_SITE' ? "bg-amber-500 text-white" : "bg-slate-100 dark:bg-white/8 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/15")}
                      >
                        {t('help_requests_page.on_site')}
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(req.id, 'RESOLVED')}
                        className="flex-1 text-[10px] font-bold py-2 rounded uppercase tracking-wider bg-slate-100 dark:bg-white/8 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all"
                      >
                        {t('help_requests_page.resolve')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="suraksha-card p-8 rounded-[1.5rem]">
            <h3 className="text-xl font-black text-slate-800 dark:text-white/90 mb-2">{t('help_requests_page.clustered_density')}</h3>
            <p className="text-slate-400 text-sm mb-6">{t('help_requests_page.clustered_desc')}</p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clusters.length === 0 && <p className="text-slate-400 col-span-full text-center py-8">{t('help_requests_page.no_geo_tagged')}</p>}
              {clusters.map((cluster: any, idx: number) => (
                <div key={idx} className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 rounded-2xl relative overflow-hidden">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center opacity-60 pointer-events-none">
                    <span className="text-red-400 font-black text-3xl">{cluster.requestCount}</span>
                  </div>
                  <MapPin className="w-8 h-8 text-red-400 mb-4 relative z-10" />
                  <h4 className="font-black text-slate-800 dark:text-white/90 text-lg relative z-10">{t('help_requests_page.cluster')}{idx + 1}</h4>
                  <p className="text-xs text-slate-400 font-bold mb-4 relative z-10">{t('help_requests_page.grid')} {cluster.centerLat?.toFixed(4)}, {cluster.centerLng?.toFixed(4)}</p>

                  <div className="space-y-2 relative z-10">
                    {cluster.requests.slice(0, 3).map((r: any) => (
                      <div key={r.id} className="text-xs font-bold text-slate-600 dark:text-slate-300 flex justify-between bg-slate-100 dark:bg-white/5 p-2 rounded border border-slate-200 dark:border-white/10">
                        <span>{r.type}</span>
                        <span className={r.priority === 'CRITICAL' ? 'text-red-400' : r.priority === 'HIGH' ? 'text-orange-400' : 'text-blue-400'}>{r.priority}</span>
                      </div>
                    ))}
                    {cluster.requests.length > 3 && (
                      <p className="text-xs text-slate-500 font-bold mt-2">+{cluster.requests.length - 3} {t('help_requests_page.more_requests')}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'sms' && (
          <div className="max-w-2xl mx-auto suraksha-card p-8 rounded-[1.5rem]">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-green-500/15 rounded-full flex items-center justify-center">
                <MessageSquare className="w-7 h-7 text-green-400" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white/90">{t('help_requests_page.sms_whatsapp')}</h3>
                <p className="text-slate-400 text-sm font-medium">{t('help_requests_page.sms_desc')}</p>
              </div>
            </div>

            <div className="bg-slate-100 dark:bg-[#0a1628] p-6 rounded-2xl space-y-4 mb-6 shadow-inner border border-slate-200 dark:border-white/10">
              <div className="flex gap-2 items-end">
                <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-white/10 flex items-center justify-center text-slate-700 dark:text-white text-xs font-bold shrink-0">CIT</div>
                <div className="bg-white dark:bg-white/8 p-3 rounded-2xl rounded-bl-none text-slate-700 dark:text-slate-200 text-sm max-w-[80%] border border-slate-200 dark:border-white/10 shadow-sm">
                  Send <strong className="text-slate-900 dark:text-white">HELP [Type] [Location] [Count]</strong> to 1919.
                </div>
              </div>

              <form onSubmit={simulateSms} className="flex gap-2 items-end justify-end mt-4">
                <input
                  type="text" value={smsPayload} onChange={e => setSmsPayload(e.target.value)} required
                  className="bg-emerald-900/40 border border-emerald-500/40 text-emerald-100 p-3 rounded-2xl rounded-br-none text-sm w-[80%] focus:outline-none focus:border-emerald-400 placeholder-emerald-700"
                />
                <button type="submit" className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 hover:bg-emerald-400 transition-colors">
                  <Navigation className="w-4 h-4 -rotate-45 ml-1" />
                </button>
              </form>

              {smsResponse && (
                <div className="flex gap-2 items-end mt-4">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">SYS</div>
                  <div className="bg-white dark:bg-white/8 p-3 rounded-2xl rounded-bl-none text-blue-600 dark:text-blue-300 text-sm max-w-[80%] border border-slate-200 dark:border-white/10 font-mono shadow-sm">
                    {smsResponse}
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 text-center font-medium">{t('help_requests_page.sms_note')}</p>
          </div>
        )}

        {toast && (
          <div className={cn(
            "fixed bottom-8 right-8 z-[999999] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-8 duration-300 font-sans",
            toast.type === 'success'
              ? "bg-white dark:bg-[#131f33] text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-lg"
              : "bg-white dark:bg-[#131f33] text-red-600 dark:text-red-400 border border-red-500/30 shadow-lg"
          )}>
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-bold text-sm tracking-wide">{toast.message}</span>
          </div>
        )}
      </div>
    </>
  )
}
