import { useEffect, useState, useCallback } from 'react'
import { useDialog } from '@/components/ui/dialogs/DialogProvider'
import { 
  Send, Bell, Radio, MapPin, Users, Info, 
  History, Clock, CheckCircle2, ChevronRight,
  ShieldAlert, Landmark, Droplets, Stethoscope, 
  Route, UserCheck, Trash2, XCircle, Search, Filter,
  Smartphone, Mail, MessageSquare, Languages, Calendar, Map, PhoneCall, BarChart2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { alertService } from '../services/api'
import { formatDistanceToNow, format } from 'date-fns'
import { useAppStore } from '@/store/useAppStore'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from 'react-i18next'
import { AreaMultiSelect } from '../components/map/AreaMultiSelect'
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts'
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";


function DeliveryStats({ alertId, type, notifiedCount }: { alertId: string, type: string, notifiedCount: number }) {
  const { t } = useTranslation()
  const [stats, setStats] = useState<{ notifiedCount: number, acknowledgedCount: number, acknowledgementRate: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const load = useCallback(async () => {
    if (notifiedCount === 0) return
    setLoading(true)
    try {
      const res = await alertService.getDeliveryStats(alertId)
      setStats(res.data)
    } catch { /* silently skip */ }
    finally { setLoading(false) }
  }, [alertId, notifiedCount])

  const bgColor = type === 'EMERGENCY' ? 'bg-red-50 border-red-100' : type === 'WARNING' ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'
  const textColor = type === 'EMERGENCY' ? 'text-red-800' : type === 'WARNING' ? 'text-amber-800' : 'text-blue-800'
  const barColor = type === 'EMERGENCY' ? 'bg-red-600' : type === 'WARNING' ? 'bg-amber-500' : 'bg-blue-600'
  const barBg = type === 'EMERGENCY' ? 'bg-red-200' : type === 'WARNING' ? 'bg-amber-200' : 'bg-blue-200'

  if (notifiedCount === 0) {
    return (
      <div className={`mt-4 p-4 rounded-2xl border ${bgColor} flex items-center gap-3`}>
        <Users className={`w-4 h-4 ${textColor} opacity-50`} />
        <span className={`text-[10px] font-black uppercase tracking-widest ${textColor} opacity-60`}>{t('alerts_page.no_zone_users')}</span>
      </div>
    )
  }

  const rate = stats?.acknowledgementRate ?? 0
  const acked = stats?.acknowledgedCount ?? 0
  const unacked = notifiedCount - acked

  return (
    <div className={`mt-4 p-4 rounded-2xl border ${bgColor}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex justify-between mb-1.5">
            <span className={`text-[10px] font-black uppercase tracking-widest ${textColor}`}>
              {t('alerts_page.delivery_notified', { count: notifiedCount })}
            </span>
            {loading ? (
              <span className={`text-[10px] font-black ${textColor} opacity-50`}>{t('alerts_page.loading_ellipsis')}</span>
            ) : stats ? (
              <span className={`text-[10px] font-black ${textColor}`}>{t('alerts_page.acknowledged', { acked, total: notifiedCount, rate })}</span>
            ) : (
              <button onClick={load} className={`text-[10px] font-black ${textColor} underline`}>{t('alerts_page.load_stats')}</button>
            )}
          </div>
          <div className={`w-full ${barBg} rounded-full h-1.5`}>
            <div className={`${barColor} h-1.5 rounded-full transition-all duration-500`} style={{ width: stats ? `${rate}%` : '0%' }} />
          </div>
        </div>
        {stats && unacked > 0 && type === 'EMERGENCY' && (
          <button
            onClick={load}
            className="bg-red-600 hover:bg-red-700 text-white text-[9px] font-black uppercase tracking-widest px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <PhoneCall className="w-3 h-3" /> {t('alerts_page.escalate_count', { count: unacked })}
          </button>
        )}
        {stats && (
          <button onClick={load} className={`text-[9px] font-black ${textColor} opacity-50 hover:opacity-100 underline whitespace-nowrap`}>
            {t('alerts_page.refresh')}
          </button>
        )}
      </div>
    </div>
  )
}

export default function AlertsPage() {
  const { confirm } = useDialog()
  const { t } = useTranslation()
  const { user } = useAuth()

  const categories = [
    {
      label: t('alerts_page.cat_flood_warning'), sub: 'Area-specific', icon: Droplets, color: 'text-blue-600', type: 'EMERGENCY',
      defaultMsg: 'URGENT: Water levels are rising rapidly in your sector. Please move to the nearest high ground immediately. Follow official evacuation routes.', defaultLoc: 'Flood Zone A'
    },
    {
      label: t('alerts_page.cat_shelter_vacancy'), sub: 'Nearby only', icon: Landmark, color: 'text-purple-600', type: 'INFO',
      defaultMsg: 'DMC Update: New shelter vacancies identified at Central Relief Camp. Basic supplies and medical aid are available on-site.', defaultLoc: 'Central District'
    },
    {
      label: t('alerts_page.cat_blood_request'), sub: 'Type match', icon: Droplets, color: 'text-red-600', type: 'WARNING',
      defaultMsg: 'CRITICAL: Urgent need for O+ and A+ blood donors at General Hospital due to incoming emergency arrivals. Please report if eligible.', defaultLoc: 'General Hospital'
    },
    {
      label: t('alerts_page.cat_medicine_needed'), sub: 'Proximity-based', icon: Stethoscope, color: 'text-pink-600', type: 'WARNING',
      defaultMsg: 'RESOURCE ALERT: Specific medical supplies (Insulin, Asthma inhalers) are running low in the Southern Sector. Donations requested.', defaultLoc: 'Southern Sector'
    },
    {
      label: t('alerts_page.cat_road_closure'), sub: 'Route-affected', icon: Route, color: 'text-blue-500', type: 'INFO',
      defaultMsg: 'TRAFFIC ADVISORY: Main bridge at Sector 4 is closed for all vehicles due to structural risks. Please use the Northern Bypass.', defaultLoc: 'Bridge Sector 4'
    },
    {
      label: t('alerts_page.cat_volunteer_needed'), sub: 'Skill-matched', icon: UserCheck, color: 'text-purple-500', type: 'INFO',
      defaultMsg: 'VOLUNTEER CALL: Specialized personnel needed for debris clearance and logistics management at Ward 7. Report to Command Post.', defaultLoc: 'Ward 7 Command'
    },
  ]
  const { searchQuery, setSearchQuery, addNotification } = useAppStore()
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Enhanced Form State
  const [newAlert, setNewAlert] = useState<{
    title: string, message: string, locations: string[], type: string,
    channels: { app: boolean, sms: boolean, whatsapp: boolean, email: boolean, radio: boolean },
    scheduledTime: string, translated: boolean, broadcastRadiusKm: number
  }>({
    title: '', message: '', locations: [], type: 'INFO',
    channels: { app: true, sms: false, whatsapp: false, email: false, radio: false },
    scheduledTime: '', translated: false, broadcastRadiusKm: 50
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isMapModalOpen, setIsMapModalOpen] = useState(false)
  const canBroadcast = user?.role === 'ADMIN' || user?.role === 'DMC_OFFICER'
  const [filterType, setFilterType] = useState('ALL')
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'SCHEDULED'>('ACTIVE')

  const fetchAlerts = async () => {
    try {
      const res = await alertService.getAlerts()
      setAlerts(res.data)
    } catch (err) {
      console.error('Failed to fetch alerts', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [])

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const isAllIsland = newAlert.locations.includes('All Island') || newAlert.locations.length === 0
      const alertData = {
        title: newAlert.title,
        message: newAlert.message,
        locations: newAlert.locations,
        type: newAlert.type,
        channels: newAlert.channels,
        scheduledTime: newAlert.scheduledTime,
        broadcastRadiusKm: isAllIsland ? null : newAlert.broadcastRadiusKm,
        translatedMsgSinhala: newAlert.translated ? `(Mock Sinhala) ${newAlert.message}` : null,
        translatedMsgTamil: newAlert.translated ? `(Mock Tamil) ${newAlert.message}` : null
      }
      await alertService.createAlert(alertData)
      
      addNotification({
        id: Date.now().toString(),
        title: newAlert.scheduledTime ? 'Directive Scheduled' : 'Directive Broadcasted',
        message: `${newAlert.title} across ${Object.values(newAlert.channels).filter(Boolean).length} channels`,
        time: 'Just now',
        type: 'alert',
        unread: true
      })

      setNewAlert({
        title: '', message: '', locations: [], type: 'INFO',
        channels: { app: true, sms: false, whatsapp: false, email: false, radio: false },
        scheduledTime: '', translated: false, broadcastRadiusKm: 50
      })
      fetchAlerts()
    } catch (err) {
      console.error('Failed to broadcast alert', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAlert = async (id: string) => {
    if (!await confirm('Are you sure you want to permanently delete this broadcast record?', { variant: 'danger', title: 'Delete broadcast', confirmLabel: 'Delete' })) return
    try {
      await alertService.deleteAlert(id)
      fetchAlerts()
    } catch (err) {
      console.error('Failed to delete alert', err)
    }
  }

  const handleDeactivate = async (id: string) => {
    try {
      await alertService.deactivateAlert(id)
      fetchAlerts()
    } catch (err) {
      console.error('Failed to deactivate alert', err)
    }
  }

  const filteredAlerts = alerts.filter(alert => {
    const locationsString = alert.locations ? alert.locations.join(', ') : ''
    const matchesSearch = alert.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          locationsString.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          alert.message.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'ALL' || alert.type === filterType
    return matchesSearch && matchesType
  })

  // Simulated Community Feedback Data
  const getMockFeedbackData = (id: string) => [
    { name: 'Safe', value: Math.floor(Math.random() * 500) + 100, color: '#22c55e' },
    { name: 'Need Help', value: Math.floor(Math.random() * 50) + 5, color: '#ef4444' },
    { name: 'Info Req', value: Math.floor(Math.random() * 100) + 20, color: '#f59e0b' }
  ]

  return (
        <>
          <PageMeta title="Alerts | Suraksha" description="Suraksha Alerts Page" />
          <PageBreadcrumb pageTitle={t('alerts_page.page_title')} />
          <div className="space-y-8 animate-in fade-in duration-500 font-sans pb-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 px-6 py-3 bg-red-50 text-red-600 rounded-2xl border border-red-100 shadow-sm">
             <Radio className="w-5 h-5 animate-pulse" />
             <span className="text-[11px] font-black uppercase tracking-widest">{t('alerts_page.global_node_active')}</span>
          </div>
        </div>

        {canBroadcast && (
          <div className="p-10 border-4 border-brand-500/10 rounded-[3.5rem] bg-gradient-to-br from-blue-50/30 to-white space-y-8 backdrop-blur-xl">
            <div className="flex items-center gap-4 text-brand-500">
               <div className="p-3 bg-brand-500 rounded-2xl text-white shadow-lg shadow-blue-500/20"><Bell className="w-6 h-6" /></div>
               <div>
                 <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">{t('alerts_page.smart_templates')}</h3>
                 <p className="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">{t('alerts_page.rapid_directive_deployment')}</p>
               </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
              {categories.map((cat, i) => (
                <div key={i} 
                  onClick={() => setNewAlert(prev => ({ ...prev, title: cat.label, type: cat.type, message: cat.defaultMsg, locations: [cat.defaultLoc] }))}
                  className="suraksha-card p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-brand-500/30 hover:scale-[1.05] transition-all bg-white dark:bg-gray-900 group"
                >
                  <div className={cn("p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform bg-gray-50 dark:bg-gray-800/50", cat.color)}><cat.icon className="w-7 h-7" /></div>
                  <span className="text-[13px] font-black text-gray-800 dark:text-white/90 leading-tight mb-1">{cat.label}</span>
                  <span className="text-[9px] font-black text-brand-500 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-tighter italic">{cat.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={cn("grid grid-cols-1 gap-10", canBroadcast ? "xl:grid-cols-12" : "")}>
          {canBroadcast && (
            <div className="xl:col-span-7 suraksha-card p-10 bg-white dark:bg-gray-900">
              <div className="flex items-center gap-3 mb-10 text-gray-800 dark:text-white/90">
                 <Send className="w-6 h-6" /> <h3 className="text-2xl font-black">{t('alerts_page.transmit_directive')}</h3>
              </div>
              
              <form onSubmit={handleBroadcast} className="space-y-10">
                <div className="space-y-8">
                  
                  {/* Channels selection */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] pl-1 italic">{t('alerts_page.transmission_channels')}</label>
                    <div className="flex flex-wrap gap-3">
                      {[
                        { id: 'app', icon: Bell, label: t('alerts_page.in_app') },
                        { id: 'sms', icon: Smartphone, label: t('alerts_page.sms_api') },
                        { id: 'whatsapp', icon: MessageSquare, label: t('alerts_page.whatsapp') },
                        { id: 'email', icon: Mail, label: t('alerts_page.email') },
                        { id: 'radio', icon: Radio, label: t('alerts_page.dmc_radio') }
                      ].map(ch => (
                        <button 
                          key={ch.id} type="button"
                          onClick={() => setNewAlert(prev => ({ ...prev, channels: { ...prev.channels, [ch.id]: !prev.channels[ch.id as keyof typeof prev.channels] } }))}
                          className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all", newAlert.channels[ch.id as keyof typeof newAlert.channels] ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm" : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:bg-gray-800/50")}
                        >
                          <ch.icon className="w-4 h-4" /> {ch.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] pl-1 italic">{t('alerts_page.directive_headline')}</label>
                    <input required type="text" placeholder={t('alerts_page.headline_placeholder')} className="suraksha-input" value={newAlert.title} onChange={(e) => setNewAlert({...newAlert, title: e.target.value})} />
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] pl-1 italic">{t('alerts_page.targeted_areas')}</label>
                          <button type="button" onClick={() => setIsMapModalOpen(true)} className="text-[9px] text-blue-600 font-black uppercase tracking-widest hover:underline flex items-center gap-1"><Map className="w-3 h-3" /> {t('alerts_page.draw_zone')}</button>
                        </div>
                        <AreaMultiSelect selectedLocations={newAlert.locations} onChange={(locations) => setNewAlert({ ...newAlert, locations })} />
                      </div>
                     <div className="space-y-3">
                       <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] pl-1 italic">{t('alerts_page.severity_level')}</label>
                       <select className="suraksha-input appearance-none bg-gray-50 dark:bg-gray-800/50 font-black text-[11px] uppercase tracking-widest" value={newAlert.type} onChange={(e) => setNewAlert({...newAlert, type: e.target.value})}>
                         <option value="INFO">{t('alerts_page.info_blue')}</option>
                         <option value="WARNING">{t('alerts_page.warning_amber')}</option>
                         <option value="EMERGENCY">{t('alerts_page.emergency_red')}</option>
                       </select>
                     </div>
                  </div>

                  {/* Broadcast radius — only relevant when specific areas are selected */}
                  {newAlert.locations.length > 0 && !newAlert.locations.includes('All Island') && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] pl-1 italic">{t('alerts_page.broadcast_radius')}</label>
                      <div className="flex gap-2">
                        {[25, 50, 75, 100].map(km => (
                          <button
                            key={km}
                            type="button"
                            onClick={() => setNewAlert(prev => ({ ...prev, broadcastRadiusKm: km }))}
                            className={cn(
                              'flex-1 py-2.5 rounded-xl text-xs font-black border transition-all',
                              newAlert.broadcastRadiusKm === km
                                ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-300'
                                : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-cyan-400/30'
                            )}
                          >
                            {km} km
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-400 pl-1">{t('alerts_page.radius_hint')}</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] pl-1 italic">{t('alerts_page.detailed_instructions')}</label>
                      <button type="button" onClick={() => setNewAlert(prev => ({...prev, translated: !prev.translated}))} className="text-[9px] text-indigo-600 font-black uppercase tracking-widest hover:underline flex items-center gap-1"><Languages className="w-3 h-3" /> {t('alerts_page.auto_translate')}</button>
                    </div>
                    <textarea required rows={5} placeholder={t('alerts_page.instructions_placeholder')} className="suraksha-input h-32 py-5 resize-none leading-relaxed font-bold" value={newAlert.message} onChange={(e) => setNewAlert({...newAlert, message: e.target.value})} />
                    
                    {newAlert.translated && (
                      <div className="grid grid-cols-2 gap-4 mt-2 animate-in slide-in-from-top-2">
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-2xl">
                           <div className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">{t('alerts_page.sinhala_translation')}</div>
                           <div className="text-xs font-bold text-slate-700 font-sinhala">{newAlert.message ? `(Mock Sinhala) ${newAlert.message}` : t('alerts_page.translating')}</div>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-2xl">
                           <div className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">{t('alerts_page.tamil_translation')}</div>
                           <div className="text-xs font-bold text-slate-700 font-tamil">{newAlert.message ? `(Mock Tamil) ${newAlert.message}` : t('alerts_page.translating')}</div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] pl-1 italic">{t('alerts_page.schedule_optional')}</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <input type="datetime-local" className="suraksha-input pl-12 font-bold text-sm" value={newAlert.scheduledTime} onChange={(e) => setNewAlert({...newAlert, scheduledTime: e.target.value})} />
                    </div>
                  </div>

                </div>

                <button disabled={isSubmitting} className="suraksha-button w-full h-20 text-lg flex items-center justify-center gap-4 transition-all uppercase tracking-widest font-black">
                   {isSubmitting ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" /> :
                   <><div className="p-2 bg-white dark:bg-gray-900/20 rounded-xl"><Send className="w-6 h-6" /></div>{newAlert.scheduledTime ? t('alerts_page.schedule_directive') : t('alerts.new_alert')}</>}
                </button>
              </form>
            </div>
          )}

          {/* Live Preview Side */}
          {canBroadcast && (
            <div className="xl:col-span-5 flex flex-col gap-8">
               <div className="p-8 bg-slate-900 rounded-[3rem] shadow-2xl relative overflow-hidden flex-1 flex flex-col justify-center min-h-[500px]">
                  <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_#0061ff_0%,_transparent_70%)] animate-pulse" />
                  <div className="relative z-10 space-y-6">
                     <div className="text-center space-y-2 mb-10">
                        <span className="text-[10px] font-black text-brand-500 uppercase tracking-[0.3em]">{t('alerts_page.omni_channel_preview')}</span>
                        <div className="w-20 h-1 bg-brand-500 mx-auto rounded-full" />
                     </div>

                     <div className="max-w-sm mx-auto w-full bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-[0_40px_60px_-15px_rgba(0,0,0,0.5)] border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-500">
                        <div className="flex items-center gap-4 mb-6">
                           <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl transition-colors duration-500", newAlert.type === 'EMERGENCY' ? 'bg-red-500' : newAlert.type === 'WARNING' ? 'bg-amber-500' : 'bg-brand-500')}>
                             <Bell className="w-6 h-6" />
                           </div>
                           <div>
                             <div className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Suraksha Node</div>
                             <div className="text-base font-black text-gray-800 dark:text-white/90 leading-tight break-words">{newAlert.title || t('alerts_page.broadcast_title_placeholder')}</div>
                           </div>
                        </div>
                        <p className="text-sm font-bold text-gray-500 dark:text-gray-400 leading-relaxed mb-6 font-sans">
                          {newAlert.message || t('alerts_page.broadcast_message_placeholder')}
                        </p>
                        
                        <div className="flex gap-2 flex-wrap mb-6">
                          {Object.entries(newAlert.channels).map(([k, v]) => v && (
                             <span key={k} className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded">✓ {k}</span>
                          ))}
                        </div>

                         <div className="flex items-center justify-between pt-5 border-t border-slate-50">
                           <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                              <MapPin className="w-3.5 h-3.5" />
                              <span className="text-[11px] font-black uppercase tracking-tight line-clamp-1">{newAlert.locations?.length > 0 ? newAlert.locations.join(', ') : t('alerts_page.all_geo_sectors')}</span>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* List Area */}
        <div className="space-y-10 pt-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
             <div>
               <h3 className="text-3xl font-black text-gray-800 dark:text-white/90">{t('alerts_page.transmission_logs')}</h3>
               <div className="flex gap-4 mt-4">
                 <button onClick={() => setActiveTab('ACTIVE')} className={cn("text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-colors", activeTab === 'ACTIVE' ? 'bg-blue-100 text-blue-700' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:bg-gray-800/50')}>{t('alerts_page.active_history')}</button>
                 <button onClick={() => setActiveTab('SCHEDULED')} className={cn("text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-colors", activeTab === 'SCHEDULED' ? 'bg-amber-100 text-amber-700' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:bg-gray-800/50')}>{t('alerts_page.scheduled_mock')}</button>
               </div>
             </div>
             
             <div className="flex items-center gap-4">
                <div className="relative group w-full md:w-64">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 group-focus-within:text-brand-500 transition-colors" />
                   <input type="text" placeholder={t('alerts_page.search_logs')} className="suraksha-input pl-12 h-12 bg-white dark:bg-gray-900" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-[#0061ff]/20 cursor-pointer h-12">
                   <option value="ALL">{t('alerts_page.all_levels')}</option>
                   <option value="INFO">{t('alerts_page.filter_info')}</option>
                   <option value="WARNING">{t('alerts_page.filter_warning')}</option>
                   <option value="EMERGENCY">{t('alerts_page.filter_emergency')}</option>
                </select>
             </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {loading ? (
               <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-200 dark:border-gray-800 shadow-sm"><p className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] animate-pulse">{t('alerts_page.decrypting_sync_logs')}</p></div>
            ) : filteredAlerts.length === 0 ? (
              <div className="text-center py-24 bg-white dark:bg-gray-900 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-gray-700">
                 <div className="p-6 bg-gray-50 dark:bg-gray-800/50 inline-block rounded-full mb-4"><XCircle className="w-10 h-10 text-slate-300" /></div>
                 <p className="text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest text-xs">{t('alerts_page.no_directive_matches')}</p>
              </div>
            ) : activeTab === 'SCHEDULED' ? (
              <div className="text-center py-10 bg-amber-50 rounded-[2rem] border border-amber-100">
                <Calendar className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                <p className="text-xs font-black text-amber-700 uppercase tracking-widest">{t('alerts_page.mock_scheduled')}</p>
              </div>
            ) : (
              filteredAlerts.map((alert, i) => (
                <div key={alert.id} className="suraksha-card p-8 flex flex-col md:flex-row md:items-start bg-white dark:bg-gray-900 hover:shadow-2xl hover:shadow-blue-500/5 transition-all group overflow-hidden border-none shadow-sm relative">
                  <div className={cn("absolute left-0 top-0 h-full w-2 transition-all", alert.type === 'EMERGENCY' ? "bg-red-500" : alert.type === 'WARNING' ? "bg-amber-500" : "bg-blue-500")} />

                  <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 md:mr-8 shadow-lg mb-6 md:mb-0", alert.type === 'EMERGENCY' ? "bg-red-50 text-red-500" : alert.type === 'WARNING' ? "bg-amber-50 text-amber-500" : "bg-blue-50 text-blue-600")}>
                    <Radio className={cn("w-8 h-8", alert.type === 'EMERGENCY' && "animate-pulse")} />
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <h4 className="text-xl font-black text-gray-800 dark:text-white/90 group-hover:text-brand-500 transition-colors leading-tight">{alert.title}</h4>
                      <span className={cn("text-[9px] font-black px-4 py-1.5 rounded-full tracking-widest uppercase border whitespace-nowrap", alert.type === 'EMERGENCY' ? "bg-red-50 text-red-600 border-red-100" : alert.type === 'WARNING' ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-blue-50 text-blue-600 border-blue-100")}>{alert.type}</span>
                    </div>
                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400 max-w-3xl">{alert.message}</p>
                    
                    <div className="flex flex-wrap items-center gap-6 pt-2">
                      <div className="flex items-center gap-2 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-tight max-w-[200px]">
                         <MapPin className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                         <span className="truncate">{alert.locations?.join(', ') || 'All Island'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-tight">
                         <Clock className="w-3.5 h-3.5 text-slate-300" />
                         {formatDistanceToNow(new Date(alert.createdAt))} ago
                      </div>
                      {alert.active && (
                         <div className="flex items-center gap-1.5 text-green-500 text-[9px] font-black uppercase tracking-widest bg-green-50 px-3 py-1 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> {t('alerts_page.live_broadcast')}
                         </div>
                      )}
                    </div>
                    
                    {/* Channels Status */}
                    <div className="flex gap-2 pt-2 border-t border-slate-50">
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1 mr-2">{t('alerts_page.dispatched_via')}</span>
                      <span title="SMS Sent"><Smartphone className="w-4 h-4 text-green-500" /></span>
                      <span title="App Sent"><Bell className="w-4 h-4 text-green-500" /></span>
                      {alert.type === 'EMERGENCY' && <span title="WhatsApp Sent"><MessageSquare className="w-4 h-4 text-green-500" /></span>}
                    </div>

                    {/* Real delivery tracking */}
                    <DeliveryStats alertId={alert.id} type={alert.type} notifiedCount={alert.notifiedCount ?? 0} />

                    {/* Community Feedback (Mocked) */}
                    {alert.active && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 mt-4">
                        <div className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><BarChart2 className="w-3 h-3" /> {t('alerts_page.community_feedback')}</div>
                        <div className="flex gap-4 h-12">
                           {getMockFeedbackData(alert.id).map((data, idx) => (
                             <div key={idx} className="flex-1 flex flex-col justify-end bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-2 relative overflow-hidden group/chart">
                                <div className="absolute bottom-0 left-0 w-full opacity-20 group-hover/chart:opacity-30 transition-opacity" style={{ height: `${(data.value / 600) * 100}%`, backgroundColor: data.color }} />
                                <div className="relative z-10 flex justify-between items-baseline">
                                  <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase">{data.name}</span>
                                  <span className="text-sm font-black" style={{ color: data.color }}>{data.value}</span>
                                </div>
                             </div>
                           ))}
                        </div>
                      </div>
                    )}

                  </div>

                  {canBroadcast && (
                    <div className="flex items-center gap-3 mt-8 md:mt-0 md:ml-10">
                      <button onClick={() => handleDeactivate(alert.id)} disabled={!alert.active} className="px-5 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all disabled:opacity-20">{t('alerts_page.end')}</button>
                      <button onClick={() => handleDeleteAlert(alert.id)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Map Zone Mock Modal */}
        {isMapModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-8 max-w-xl w-full shadow-2xl relative">
              <h3 className="text-xl font-black text-slate-800 mb-2">{t('alerts_page.draw_alert_polygon')}</h3>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-6">{t('alerts_page.polygon_mock_desc')}</p>
              <div className="h-64 bg-blue-50 border-2 border-dashed border-blue-200 rounded-2xl flex items-center justify-center mb-6 relative overflow-hidden">
                 <MapPin className="w-10 h-10 text-blue-400 opacity-50" />
                 <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100">
                   <polygon points="20,20 80,30 70,80 10,70" fill="#0061ff" stroke="#0061ff" strokeWidth="2" />
                 </svg>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setIsMapModalOpen(false)} className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 dark:bg-gray-700">{t('alerts_page.cancel')}</button>
                <button onClick={() => {
                  setNewAlert(prev => ({...prev, locations: [...prev.locations, 'Geo-Polygon #7A']}))
                  setIsMapModalOpen(false)
                }} className="px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700">{t('alerts_page.save_zone')}</button>
              </div>
            </div>
          </div>
        )}
      </div>
        </>
      )
}
