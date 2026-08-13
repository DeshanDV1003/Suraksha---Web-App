import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Clock, MapPin, Users, Loader2, Navigation, MessageSquare, CheckCircle2, AlertCircle, Smartphone, Phone, Send, ShieldAlert } from 'lucide-react'
import { helpRequestService, volunteerService } from '@/services/api'
import { cn } from '@/lib/utils'
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import { useAuth } from '@/hooks/useAuth'

// ── Status config ────────────────────────────────────────────────────────────
const STATUS_STEPS = [
  { key: 'PENDING',   label: 'Received',   desc: 'Your request has been received by the command centre.' },
  { key: 'ASSIGNED',  label: 'Assigned',   desc: 'A responder has been assigned to your request.' },
  { key: 'EN_ROUTE',  label: 'On the Way', desc: 'Your responder is on their way to you.' },
  { key: 'ON_SITE',   label: 'On Site',    desc: 'Responder has arrived at your location.' },
  { key: 'RESOLVED',  label: 'Resolved',   desc: 'Your request has been resolved.' },
]

function StatusTracker({ status }: { status: string }) {
  const currentIdx = STATUS_STEPS.findIndex(s => s.key === status)
  return (
    <div className="mt-4">
      <div className="flex items-center gap-0">
        {STATUS_STEPS.map((step, idx) => {
          const done = idx <= currentIdx
          const active = idx === currentIdx
          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all",
                  done
                    ? active
                      ? "bg-cyan-500 border-cyan-400 text-white shadow-lg shadow-cyan-500/30"
                      : "bg-emerald-500 border-emerald-400 text-white"
                    : "bg-slate-100 dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-400"
                )}>
                  {done && !active ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                </div>
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-wider text-center w-14",
                  active ? "text-cyan-400" : done ? "text-emerald-400" : "text-slate-400"
                )}>{step.label}</span>
              </div>
              {idx < STATUS_STEPS.length - 1 && (
                <div className={cn("flex-1 h-0.5 mx-1 mb-4 rounded", idx < currentIdx ? "bg-emerald-400" : "bg-slate-200 dark:bg-white/10")} />
              )}
            </div>
          )
        })}
      </div>
      <p className="text-xs text-slate-400 font-medium mt-2 text-center">
        {STATUS_STEPS[currentIdx]?.desc ?? ''}
      </p>
    </div>
  )
}

// ── Citizen SOS Form + My Requests ───────────────────────────────────────────
function CitizenHelpForm() {
  const [form, setForm] = useState({
    type: 'FLOOD_RESCUE',
    description: '',
    location: '',
    peopleCount: 1,
    priority: 'HIGH',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [locating, setLocating] = useState(false)
  const [myRequests, setMyRequests] = useState<any[]>([])
  const [loadingRequests, setLoadingRequests] = useState(true)

  const requestTypes = [
    { value: 'FLOOD_RESCUE', label: '🌊 Flood Rescue' },
    { value: 'MEDICAL',      label: '🏥 Medical Emergency' },
    { value: 'TRAPPED',      label: '⚠️ Trapped / Stranded' },
    { value: 'FOOD_WATER',   label: '🥤 Food & Water Needed' },
    { value: 'EVACUATION',   label: '🚨 Evacuation Needed' },
    { value: 'STRUCTURAL',   label: '🏚️ Structural Damage' },
    { value: 'OTHER',        label: '📋 Other Emergency' },
  ]

  const fetchMyRequests = async () => {
    try {
      const res = await helpRequestService.getMyRequests()
      setMyRequests(res.data)
    } catch {
      // silently fail
    } finally {
      setLoadingRequests(false)
    }
  }

  useEffect(() => {
    fetchMyRequests()
    const iv = setInterval(fetchMyRequests, 15000)
    return () => clearInterval(iv)
  }, [])

  const getLocation = () => {
    setLocating(true)
    navigator.geolocation?.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
          const data = await res.json()
          setForm(f => ({ ...f, location: data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}` }))
        } catch {
          setForm(f => ({ ...f, location: `${lat.toFixed(5)}, ${lng.toFixed(5)}` }))
        }
        setLocating(false)
      },
      () => { setLocating(false); setError('Could not get your location. Please type it manually.') },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.description.trim()) return setError('Please describe your emergency.')
    if (!form.location.trim()) return setError('Please provide your location.')
    setError('')
    setSubmitting(true)
    try {
      await helpRequestService.createRequest(form)
      setSubmitted(true)
      setForm({ type: 'FLOOD_RESCUE', description: '', location: '', peopleCount: 1, priority: 'HIGH' })
      fetchMyRequests()
    } catch {
      setError('Failed to send request. Please try again or call 1990.')
    } finally {
      setSubmitting(false)
    }
  }

  const priorityColor: Record<string, string> = {
    CRITICAL: 'text-red-400 bg-red-500/10 border-red-500/30',
    HIGH:     'text-orange-400 bg-orange-500/10 border-orange-500/30',
    MEDIUM:   'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    LOW:      'text-blue-400 bg-blue-500/10 border-blue-500/30',
  }

  return (
    <div className="space-y-4 w-full">

      {/* Emergency callout */}
      <div className="flex items-center gap-4 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl">
        <Phone className="w-5 h-5 text-red-400 shrink-0" />
        <p className="text-sm font-bold text-red-400">
          Life-threatening emergency? Call <span className="text-red-300 text-base">1990</span> immediately — don't wait for this form.
        </p>
      </div>

      {submitted && (
        <div className="flex items-center gap-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="text-sm font-black text-emerald-400">Help request sent! Track its progress on the right.</p>
            <p className="text-xs text-emerald-400/70 font-medium">A responder will be dispatched to you shortly.</p>
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-2 gap-6 items-start">

        {/* LEFT — SOS Form */}
        <div className="suraksha-card p-6 rounded-[1.5rem] space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800 dark:text-white/90">Request Emergency Help</h2>
              <p className="text-slate-400 text-xs font-medium">A responder will be dispatched to your location.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Type of Emergency</label>
              <div className="grid grid-cols-2 gap-2">
                {requestTypes.map(rt => (
                  <button key={rt.value} type="button"
                    onClick={() => setForm(f => ({ ...f, type: rt.value }))}
                    className={cn(
                      "p-2.5 rounded-xl text-xs font-bold text-left transition-all border",
                      form.type === rt.value
                        ? "bg-red-500/15 border-red-500/50 text-red-400"
                        : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-red-400/40"
                    )}>
                    {rt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Describe Your Situation</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                placeholder="e.g. Water is rising, 4 people trapped on second floor..."
                className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none" />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Your Location</label>
              <div className="flex gap-2">
                <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="Street, area, or landmark..."
                  className="flex-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-400" />
                <button type="button" onClick={getLocation} disabled={locating}
                  className="flex items-center gap-1.5 px-3 py-2.5 bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 rounded-xl text-xs font-bold hover:bg-cyan-500/25 transition-all disabled:opacity-50 shrink-0">
                  {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
                  {locating ? 'Locating…' : 'GPS'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">People Affected</label>
                <input type="number" min={1} max={500} value={form.peopleCount}
                  onChange={e => setForm(f => ({ ...f, peopleCount: parseInt(e.target.value) || 1 }))}
                  className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-cyan-400" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Priority</label>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                  className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-cyan-400">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High — Urgent</option>
                  <option value="CRITICAL">Critical — Life at risk</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm font-bold bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            <button type="submit" disabled={submitting}
              className="w-full py-3.5 bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white font-black text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {submitting ? 'Sending SOS…' : 'Send SOS Request'}
            </button>
          </form>
        </div>

        {/* RIGHT — My Requests */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-800 dark:text-white/90">My Help Requests</h2>
            <button onClick={fetchMyRequests} className="text-xs text-cyan-400 font-bold hover:text-cyan-300 transition-colors">Refresh</button>
          </div>

          {loadingRequests && (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-cyan-400" /></div>
          )}

          {!loadingRequests && myRequests.length === 0 && (
            <div className="text-center py-12 text-slate-400 font-medium bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 text-sm">
              No help requests yet. Submit one on the left if you need assistance.
            </div>
          )}

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {myRequests.map(req => (
              <div key={req.id} className={cn(
                "suraksha-card p-5 rounded-2xl space-y-3",
                req.status === 'RESOLVED' ? "opacity-60" : ""
              )}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-sm text-slate-800 dark:text-white/90">{req.type.replace(/_/g, ' ')}</h3>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider border", priorityColor[req.priority] || 'text-slate-400')}>
                        {req.priority}
                      </span>
                      {req.status === 'RESOLVED' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">Resolved</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-medium mt-1 truncate">{req.description}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold shrink-0">
                    {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
                  <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3 shrink-0" />{req.location}</span>
                  <span className="flex items-center gap-1 shrink-0"><Users className="w-3 h-3" />{req.peopleCount || 1}</span>
                </div>

                <StatusTracker status={req.status} />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
// ─────────────────────────────────────────────────────────────────────────────

export default function HelpRequestsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const isCitizen = user?.role === 'CITIZEN' || user?.role === 'VOLUNTEER'
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

  if (isCitizen) {
    return (
      <>
        <PageMeta title="Request Help | Suraksha" description="Submit an emergency help request" />
        <PageBreadcrumb pageTitle="Request Help" />
        <div className="animate-in fade-in duration-500 pb-10 w-full min-w-0">
          <CitizenHelpForm />
        </div>
      </>
    )
  }

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
            { id: 'map', label: t('help_requests_page.tabs.clustered_hotspots'), icon: MapPin }
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
