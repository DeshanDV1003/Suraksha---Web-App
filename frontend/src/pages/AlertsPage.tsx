import { useEffect, useState } from 'react'
import { 
  Send, Bell, Radio, MapPin, Users, Info, 
  History, Clock, CheckCircle2, ChevronRight,
  ShieldAlert, Landmark, Droplets, Stethoscope, 
  Route, UserCheck, Trash2, XCircle, Search, Filter
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { alertService } from '../services/api'
import { formatDistanceToNow } from 'date-fns'
import { useAppStore } from '@/store/useAppStore'

const categories = [
  { 
    label: 'Flood Warning', 
    sub: 'Area-specific', 
    icon: Droplets, 
    color: 'text-blue-600', 
    type: 'EMERGENCY',
    defaultMsg: 'URGENT: Water levels are rising rapidly in your sector. Please move to the nearest high ground immediately. Follow official evacuation routes.',
    defaultLoc: 'Flood Zone A'
  },
  { 
    label: 'Shelter Vacancy', 
    sub: 'Nearby only', 
    icon: Landmark, 
    color: 'text-purple-600', 
    type: 'INFO',
    defaultMsg: 'DMC Update: New shelter vacancies identified at Central Relief Camp. Basic supplies and medical aid are available on-site.',
    defaultLoc: 'Central District'
  },
  { 
    label: 'Blood Request', 
    sub: 'Type match', 
    icon: Droplets, 
    color: 'text-red-600', 
    type: 'WARNING',
    defaultMsg: 'CRITICAL: Urgent need for O+ and A+ blood donors at General Hospital due to incoming emergency arrivals. Please report if eligible.',
    defaultLoc: 'General Hospital'
  },
  { 
    label: 'Medicine Needed', 
    sub: 'Proximity-based', 
    icon: Stethoscope, 
    color: 'text-pink-600', 
    type: 'WARNING',
    defaultMsg: 'RESOURCE ALERT: Specific medical supplies (Insulin, Asthma inhalers) are running low in the Southern Sector. Donations requested.',
    defaultLoc: 'Southern Sector'
  },
  { 
    label: 'Road Closure', 
    sub: 'Route-affected', 
    icon: Route, 
    color: 'text-blue-500', 
    type: 'INFO',
    defaultMsg: 'TRAFFIC ADVISORY: Main bridge at Sector 4 is closed for all vehicles due to structural risks. Please use the Northern Bypass.',
    defaultLoc: 'Bridge Sector 4'
  },
  { 
    label: 'Volunteer Needed', 
    sub: 'Skill-matched', 
    icon: UserCheck, 
    color: 'text-purple-500', 
    type: 'INFO',
    defaultMsg: 'VOLUNTEER CALL: Specialized personnel needed for debris clearance and logistics management at Ward 7. Report to Command Post.',
    defaultLoc: 'Ward 7 Command'
  },
]

export default function AlertsPage() {
  const { searchQuery, setSearchQuery, addNotification } = useAppStore()
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newAlert, setNewAlert] = useState({ title: '', message: '', location: '', type: 'INFO' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Filter State
  const [filterType, setFilterType] = useState('ALL')

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
      await alertService.createAlert(newAlert)
      
      // Add notification to global store
      addNotification({
        id: Date.now().toString(),
        title: 'Directive Broadcasted',
        message: `New alert: ${newAlert.title} in ${newAlert.location}`,
        time: 'Just now',
        type: 'alert',
        unread: true
      })

      setNewAlert({ title: '', message: '', location: '', type: 'INFO' })
      fetchAlerts()
    } catch (err) {
      console.error('Failed to broadcast alert', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAlert = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this broadcast record?')) return
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
    const matchesSearch = alert.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          alert.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          alert.message.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'ALL' || alert.type === filterType
    return matchesSearch && matchesType
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-[#1e293b]">Alert Broadcasting</h1>
          <p className="text-slate-500 mt-1 font-bold uppercase text-[10px] tracking-[0.2em] opacity-70 italic">Emergency multi-channel communications hub</p>
        </div>
        <div className="flex items-center gap-3 px-6 py-3 bg-red-50 text-red-600 rounded-2xl border border-red-100 shadow-sm">
           <Radio className="w-5 h-5 animate-pulse" />
           <span className="text-[11px] font-black uppercase tracking-widest">Global Node Active</span>
        </div>
      </div>

      {/* Smart Categories Box */}
      <div className="p-10 border-4 border-[#0061ff]/10 rounded-[3.5rem] bg-gradient-to-br from-blue-50/30 to-white space-y-8 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-[#0061ff]">
             <div className="p-3 bg-[#0061ff] rounded-2xl text-white shadow-lg shadow-blue-500/20">
               <Bell className="w-6 h-6" />
             </div>
             <div>
               <h3 className="text-xl font-black uppercase tracking-tighter">Smart Templates</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rapid directive deployment</p>
             </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
          {categories.map((cat, i) => (
            <div key={i} 
              onClick={() => setNewAlert({
                title: cat.label, 
                type: cat.type, 
                message: cat.defaultMsg, 
                location: cat.defaultLoc
              })}
              className="suraksha-card p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#0061ff]/30 hover:scale-[1.05] transition-all bg-white group"
            >
              <div className={cn("p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform bg-slate-50", cat.color)}>
                <cat.icon className="w-7 h-7" />
              </div>
              <span className="text-[13px] font-black text-[#1e293b] leading-tight mb-1">{cat.label}</span>
              <span className="text-[9px] font-black text-[#0061ff] bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-tighter italic">{cat.type}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* Creator Form */}
        <div className="xl:col-span-7 suraksha-card p-10 bg-white">
          <div className="flex items-center gap-3 mb-10 text-[#1e293b]">
             <Send className="w-6 h-6" />
             <h3 className="text-2xl font-black">Transmit Directive</h3>
          </div>
          
          <form onSubmit={handleBroadcast} className="space-y-10">
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1 italic">Directive Headline</label>
                <input 
                  required
                  type="text"
                  placeholder="e.g. Flash Flood Emergency Protocol"
                  className="suraksha-input"
                  value={newAlert.title}
                  onChange={(e) => setNewAlert({...newAlert, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-8">
                 <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1 italic">Affected Geo-Sector</label>
                   <input 
                     required
                     type="text"
                     placeholder="e.g. Western Province"
                     className="suraksha-input"
                     value={newAlert.location}
                     onChange={(e) => setNewAlert({...newAlert, location: e.target.value})}
                   />
                 </div>
                 <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1 italic">Severity Level</label>
                   <select 
                     className="suraksha-input appearance-none bg-slate-50 font-black text-[11px] uppercase tracking-widest"
                     value={newAlert.type}
                     onChange={(e) => setNewAlert({...newAlert, type: e.target.value})}
                   >
                     <option value="INFO">Information (Blue)</option>
                     <option value="WARNING">Warning (Amber)</option>
                     <option value="EMERGENCY">Emergency (Red)</option>
                   </select>
                 </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1 italic">Detailed Instructions</label>
                <textarea 
                  required
                  rows={5}
                  placeholder="Provide precise evacuation steps or resource allocation info..."
                  className="suraksha-input h-40 py-5 resize-none leading-relaxed font-bold"
                  value={newAlert.message}
                  onChange={(e) => setNewAlert({...newAlert, message: e.target.value})}
                />
              </div>
            </div>

            <button 
              disabled={isSubmitting}
              className="suraksha-button w-full h-20 text-lg flex items-center justify-center gap-4 transition-all uppercase tracking-widest font-black"
            >
               {isSubmitting ? (
                 <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
               ) : (
                 <>
                   <div className="p-2 bg-white/20 rounded-xl">
                      <Radio className="w-6 h-6" />
                   </div>
                   Execute Critical Broadcast
                 </>
               )}
            </button>
          </form>
        </div>

        {/* Live Preview Side */}
        <div className="xl:col-span-5 flex flex-col gap-8">
           <div className="p-8 bg-slate-900 rounded-[3rem] shadow-2xl relative overflow-hidden flex-1 flex flex-col justify-center min-h-[500px]">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_#0061ff_0%,_transparent_70%)] animate-pulse" />
              <div className="relative z-10 space-y-6">
                 <div className="text-center space-y-2 mb-10">
                    <span className="text-[10px] font-black text-[#0061ff] uppercase tracking-[0.3em]">Mobile Sync Preview</span>
                    <div className="w-20 h-1 bg-[#0061ff] mx-auto rounded-full" />
                 </div>

                 <div className="max-w-sm mx-auto w-full bg-white p-8 rounded-[2.5rem] shadow-[0_40px_60px_-15px_rgba(0,0,0,0.5)] border border-slate-100 animate-in zoom-in-95 duration-500">
                    <div className="flex items-center gap-4 mb-6">
                       <div className={cn(
                         "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl transition-colors duration-500",
                         newAlert.type === 'EMERGENCY' ? 'bg-red-500 shadow-red-500/30' : 
                         newAlert.type === 'WARNING' ? 'bg-amber-500 shadow-amber-500/30' :
                         'bg-[#0061ff] shadow-blue-500/30'
                       )}>
                         <Bell className="w-6 h-6" />
                       </div>
                       <div>
                         <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Suraksha Cloud</div>
                         <div className="text-base font-black text-[#1e293b] leading-tight break-words">{newAlert.title || 'Broadcast Title'}</div>
                       </div>
                    </div>
                    <p className="text-sm font-bold text-slate-500 leading-relaxed mb-6 font-sans">
                      {newAlert.message || 'The detailed emergency broadcast text will synchronize across all citizen and responder mobile nodes in real-time...'}
                    </p>
                    <div className="flex items-center justify-between pt-5 border-t border-slate-50">
                       <div className="flex items-center gap-2 text-slate-400">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-black uppercase tracking-tight">{newAlert.location || 'All Geo-Sectors'}</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* List Area */}
      <div className="space-y-10 pt-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
           <h3 className="text-3xl font-black text-[#1e293b]">Transmission Logs</h3>
           <div className="flex items-center gap-4">
              <div className="relative group w-full md:w-64">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#0061ff] transition-colors" />
                 <input 
                   type="text" 
                   placeholder="Search logs..." 
                   className="suraksha-input pl-12 h-12 bg-white"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                 />
              </div>
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-[#0061ff]/20 cursor-pointer h-12"
              >
                 <option value="ALL">All Levels</option>
                 <option value="INFO">Info</option>
                 <option value="WARNING">Warning</option>
                 <option value="EMERGENCY">Emergency</option>
              </select>
           </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {loading ? (
             <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Decrypting Sync Logs...</p>
             </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
               <div className="p-6 bg-slate-50 inline-block rounded-full mb-4">
                  <XCircle className="w-10 h-10 text-slate-300" />
               </div>
               <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No Directive Matches Found</p>
            </div>
          ) : (
            filteredAlerts.map((alert, i) => (
              <div key={alert.id} className="suraksha-card p-10 flex flex-col md:flex-row md:items-center bg-white hover:shadow-2xl hover:shadow-blue-500/5 transition-all group overflow-hidden border-none shadow-sm relative">
                {/* Status Bar */}
                <div className={cn(
                  "absolute left-0 top-0 h-full w-2 group-hover:w-3 transition-all",
                  alert.type === 'EMERGENCY' ? "bg-red-500" :
                  alert.type === 'WARNING' ? "bg-amber-500" :
                  "bg-blue-500"
                )} />

                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 md:mr-10 shadow-lg mb-6 md:mb-0",
                  alert.type === 'EMERGENCY' ? "bg-red-50 text-red-500" : 
                  alert.type === 'WARNING' ? "bg-amber-50 text-amber-500" :
                  "bg-blue-50 text-blue-600"
                )}>
                  <Radio className={cn("w-8 h-8", alert.type === 'EMERGENCY' && "animate-pulse")} />
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <h4 className="text-xl font-black text-[#1e293b] group-hover:text-[#0061ff] transition-colors leading-tight">{alert.title}</h4>
                    <span className={cn(
                      "text-[9px] font-black px-4 py-1.5 rounded-full tracking-widest uppercase border whitespace-nowrap",
                      alert.type === 'EMERGENCY' ? "bg-red-50 text-red-600 border-red-100" : 
                      alert.type === 'WARNING' ? "bg-amber-50 text-amber-600 border-amber-100" :
                      "bg-blue-50 text-blue-600 border-blue-100"
                    )}>
                      {alert.type}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-400 max-w-2xl line-clamp-1">{alert.message}</p>
                  <div className="flex flex-wrap items-center gap-6 pt-2">
                    <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-tight">
                       <MapPin className="w-3.5 h-3.5 text-slate-300" />
                       {alert.location}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-tight">
                       <Clock className="w-3.5 h-3.5 text-slate-300" />
                       {formatDistanceToNow(new Date(alert.createdAt))} ago
                    </div>
                    {alert.active && (
                       <div className="flex items-center gap-1.5 text-green-500 text-[9px] font-black uppercase tracking-widest bg-green-50 px-3 py-1 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Live Broadcast
                       </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-8 md:mt-0 md:ml-10 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                   <button 
                     onClick={() => handleDeactivate(alert.id)}
                     disabled={!alert.active}
                     className="px-5 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all disabled:opacity-20"
                   >
                     End
                   </button>
                   <button 
                     onClick={() => handleDeleteAlert(alert.id)}
                     className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                   >
                     <Trash2 className="w-5 h-5" />
                   </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
