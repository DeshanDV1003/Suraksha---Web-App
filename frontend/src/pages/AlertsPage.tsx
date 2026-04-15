import { 
  Send, Bell, Radio, MapPin, Users, Info, 
  History, Clock, CheckCircle2, ChevronRight,
  ShieldAlert, Landmark, Droplets, Stethoscope, 
  Route, UserCheck
} from 'lucide-react'
import { cn } from '@/lib/utils'

const categories = [
  { label: 'Flood Warning', sub: 'Area-specific', icon: Droplets, color: 'text-blue-600' },
  { label: 'Shelter Vacancy', sub: 'Nearby only', icon: Landmark, color: 'text-purple-600' },
  { label: 'Blood Request', sub: 'Type match', icon: Droplets, color: 'text-red-600' },
  { label: 'Medicine Needed', sub: 'Proximity-based', icon: Stethoscope, color: 'text-pink-600' },
  { label: 'Road Closure', sub: 'Route-affected', icon: Route, color: 'text-blue-500' },
  { label: 'Volunteer Needed', sub: 'Skill-matched', icon: UserCheck, color: 'text-purple-500' },
]

const recentBroadcasts = [
  {
    title: 'Flash Flood Warning - Immediate Evacuation',
    location: 'Colombo 7, Bambalapitiya, Wellawatta',
    recipients: '2340 recipients',
    channels: ['FCM', 'SMS', 'Web'],
    time: '10 min ago',
    status: 'ACTIVE',
    accent: 'bg-red-500'
  },
  {
    title: 'Landslide Risk Alert',
    location: 'Kandy District - Hill Areas',
    recipients: '1520 recipients',
    channels: ['FCM', 'Web'],
    time: '1 hour ago',
    status: 'ACTIVE',
    accent: 'bg-orange-500'
  },
  {
    title: 'Severe Weather Advisory',
    location: 'Galle, Matara Districts',
    recipients: '3100 recipients',
    channels: ['FCM', 'SMS'],
    time: '3 hours ago',
    status: 'EXPIRED',
    accent: 'bg-amber-400'
  },
]

export default function AlertsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1e293b]">Alert Broadcasting</h1>
          <p className="text-slate-500 mt-1 font-medium">Smart targeted notifications to reduce alert fatigue</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-[#0061ff] text-white rounded-xl text-[13px] font-semibold shadow-lg shadow-blue-500/25">
          <Radio className="w-4 h-4" />
          Broadcast New Alert
        </button>
      </div>

      {/* Smart Categories Box */}
      <div className="p-8 border-2 border-purple-200/60 rounded-[2.5rem] bg-purple-50/40 space-y-6 shadow-sm">
        <div className="flex items-center gap-2 text-purple-700">
           <Bell className="w-4 h-4" />
           <h3 className="text-[17px] font-bold tracking-tight">Smart Notification Categories</h3>
        </div>
        <p className="text-[13px] font-semibold text-purple-600/70 -mt-4">Targeted notifications reduce alert fatigue and ensure people only receive relevant alerts</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-fit">
          {categories.map((cat, i) => (
            <div key={i} className="suraksha-card p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:border-purple-300 hover:shadow-md transition-all group">
              <span className="text-[14px] font-bold text-slate-700 mb-0.5">{cat.label}</span>
              <span className="text-[11px] font-semibold text-slate-400">{cat.sub}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="suraksha-card p-10 space-y-10">
        <h3 className="text-xl font-bold text-[#1e293b]">Create Alert</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Form Left */}
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-sm font-bold text-[#1e293b]">Alert Message</label>
              <textarea 
                placeholder="Enter alert message..."
                className="w-full min-h-[140px] p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0061ff]/10 focus:border-[#0061ff]/30 resize-none"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-[#1e293b]">Priority Level</label>
              <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0061ff]/10">
                <option>Critical</option>
                <option>High</option>
                <option>Medium</option>
              </select>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold text-[#1e293b]">Broadcast Channels</label>
              <div className="space-y-3">
                {['Push Notifications (FCM)', 'SMS Gateway', 'Web Dashboard Banner'].map((channel, i) => (
                  <div key={i} className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-5 h-5 rounded-md border-2 border-[#0061ff] bg-[#0061ff] flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm font-bold text-slate-600 group-hover:text-[#0061ff]">{channel}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form Right: Map */}
          <div className="space-y-3 h-full flex flex-col">
            <label className="text-sm font-bold text-[#1e293b]">Target Geographic Zone</label>
            <div className="flex-1 bg-sky-50/50 border-2 border-dashed border-sky-300 rounded-[2rem] flex flex-col items-center justify-center p-8 relative overflow-hidden group">
               <div className="w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center text-[#0061ff] mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 scale-150 blur-sm bg-blue-500/20 rounded-full" />
                    <div className="w-8 h-8 rounded-full border-2 border-[#0061ff] flex items-center justify-center relative z-10">
                      <div className="w-4 h-4 rounded-full border-2 border-[#0061ff] flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#0061ff]" />
                      </div>
                    </div>
                  </div>
               </div>
               <span className="text-lg font-bold text-[#1e293b]">Draw Polygon on Map</span>
               <span className="text-sm font-bold text-slate-400 mt-1">Click to select target area</span>
               
               <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-100 shadow-sm text-[11px] font-bold text-slate-600">
                  Est. Recipients: <span className="font-black text-[#1e293b]">2,340</span>
               </div>
            </div>
          </div>
        </div>

        <button className="w-full py-5 bg-[#0061ff] text-white rounded-2xl text-[16px] font-bold flex items-center justify-center gap-3 shadow-xl shadow-blue-500/25 hover:scale-[1.01] transition-transform active:scale-[0.98]">
           <Send className="w-5 h-5" />
           Broadcast Alert to 2,340 Recipients
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold text-[#1e293b] px-2">Recent Broadcasts</h3>
        <div className="space-y-4">
          {recentBroadcasts.map((alert, i) => (
            <div key={i} className="suraksha-card p-0 flex h-fit hover:shadow-lg transition-all border-none">
              <div className={cn("w-1.5 shrink-0", alert.accent)} />
              <div className="flex-1 p-6 bg-white rounded-r-[2rem] border border-slate-100 border-l-0">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <h4 className="text-lg font-bold text-[#1e293b]">{alert.title}</h4>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-400">
                      <MapPin className="w-4 h-4 text-slate-300" />
                      {alert.location}
                    </div>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold px-3 py-1 rounded-full tracking-widest",
                    alert.status === 'ACTIVE' ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400"
                  )}>
                    {alert.status}
                  </span>
                </div>
                
                <div className="flex items-center justify-between mt-6">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-[12px] font-bold text-slate-400">
                      <Users className="w-4 h-4 text-slate-300" />
                      {alert.recipients}
                    </div>
                    <div className="flex items-center gap-2">
                       {alert.channels.map((ch, idx) => (
                         <span key={idx} className="text-[10px] font-bold px-2 py-1 bg-blue-50 text-blue-600 rounded-md tracking-tighter">{ch}</span>
                       ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-slate-300" />
                    {alert.time}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
