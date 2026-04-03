import { Bell, MapPin, Users, Send, CheckCircle2, Clock, Target, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const recentAlerts = [
  { 
    id: 1, 
    title: 'Flash Flood Warning - Immediate Evacuation', 
    area: 'Colombo 7, Bambalapitiya, Wellawatta', 
    recipients: 2340, 
    status: 'ACTIVE', 
    time: '10 min ago',
    priority: 'Critical',
    channels: ['FCM', 'SMS', 'Web'],
    color: 'bg-red-500'
  },
  { 
    id: 2, 
    title: 'Landslide Risk Alert', 
    area: 'Kandy District - Hill Areas', 
    recipients: 1520, 
    status: 'ACTIVE', 
    time: '1 hour ago',
    priority: 'High',
    channels: ['FCM', 'Web'],
    color: 'bg-orange-500'
  },
  { 
    id: 3, 
    title: 'Severe Weather Advisory', 
    area: 'Galle, Matara Districts', 
    recipients: 3100, 
    status: 'EXPIRED', 
    time: '3 hours ago',
    priority: 'Medium',
    channels: ['FCM', 'SMS'],
    color: 'bg-yellow-500'
  },
]

export default function AlertsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase tracking-tight">Alert Broadcasting</h1>
          <p className="text-muted-foreground mt-1 font-medium">Create and manage geo-targeted alerts</p>
        </div>
        <button className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95">
          <Bell className="w-5 h-5" />
          Broadcast New Alert
        </button>
      </div>

      {/* Main Creation Card */}
      <div className="suraksha-card p-8 space-y-8">
        <h3 className="text-xl font-bold">Create Alert</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Form Details */}
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">Alert Message</label>
              <textarea 
                rows={5}
                placeholder="Enter alert message..."
                className="w-full bg-muted/20 border border-border/60 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none placeholder:text-muted-foreground/40 font-medium"
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">Priority Level</label>
              <div className="relative group">
                <select className="w-full bg-muted/20 border border-border/60 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer appearance-none">
                  <option>Critical</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors pointer-events-none" />
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">Broadcast Channels</label>
              <div className="space-y-3">
                {[
                  { id: 'fcm', label: 'Push Notifications (FCM)' },
                  { id: 'sms', label: 'SMS Gateway' },
                  { id: 'web', label: 'Web Dashboard Banner' },
                ].map((channel) => (
                  <label key={channel.id} className="flex items-center gap-3 cursor-pointer group w-fit">
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        defaultChecked 
                        className="peer appearance-none w-5 h-5 border-2 border-primary/20 rounded-md checked:bg-primary checked:border-primary transition-all shadow-sm"
                      />
                      <CheckCircle2 className="absolute inset-0 w-5 h-5 text-white scale-0 transition-transform peer-checked:scale-75" />
                    </div>
                    <span className="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors tracking-tight">
                      {channel.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Map Selection */}
          <div className="space-y-3 flex flex-col h-full">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">Target Geographic Zone</label>
            <div className="flex-1 min-h-[300px] rounded-3xl border-2 border-dashed border-primary/20 bg-primary/[0.03] flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="flex flex-col items-center text-center p-8 space-y-4 relative z-10 transition-transform group-hover:scale-105 duration-500">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl shadow-primary/10 border border-primary/5">
                  <Target className="w-8 h-8 text-primary animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-black tracking-tight">Draw Polygon on Map</h4>
                  <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider mt-1 opacity-60">Click to select target area</p>
                </div>
              </div>
              
              {/* Badge Overlay */}
              <div className="absolute bottom-6 right-6 bg-white px-3 py-1.5 rounded-xl border border-primary/10 shadow-xl flex items-center gap-2">
                <span className="text-[10px] font-black text-muted-foreground/60 uppercase">Est. Recipients</span>
                <span className="text-xs font-black text-primary">2,340</span>
              </div>
              
              {/* Decorative radial gradient */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-[80px]" />
            </div>
          </div>
        </div>

        <button className="w-full py-5 bg-[#008BB1] text-white rounded-2xl text-base font-black flex items-center justify-center gap-3 shadow-xl shadow-[#008BB1]/20 hover:shadow-2xl hover:bg-[#007da0] hover:scale-[1.01] transition-all active:scale-[0.99] group mt-4">
          <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          Broadcast Alert to 2,340 Recipients
        </button>
      </div>

      {/* History List */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold px-2">Recent Broadcasts</h3>
        <div className="space-y-5">
          {recentAlerts.map((alert) => (
            <div key={alert.id} className="suraksha-card p-6 flex flex-col shadow-xl hover:translate-y-[-2px] transition-all bg-card/60 backdrop-blur-sm relative group overflow-hidden">
               {/* Left sidebar color */}
               <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", alert.color)} />
               
               <div className="pl-4 flex flex-col space-y-4">
                  <div className="flex justify-between items-start">
                    <h4 className="text-xl font-black text-foreground group-hover:text-primary transition-colors">{alert.title}</h4>
                    <span className={cn(
                      "text-[10px] font-black px-3 py-1 rounded-full tracking-widest",
                      alert.status === 'ACTIVE' ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground"
                    )}>
                      {alert.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground font-medium">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span className="text-sm">{alert.area}</span>
                  </div>

                  <div className="w-full border-t border-border/40 my-2" />

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-8">
                       <div className="flex items-center gap-3 text-muted-foreground">
                         <Users className="w-4 h-4" />
                         <span className="text-xs font-bold">{alert.recipients.toLocaleString()} recipients</span>
                       </div>
                       
                       <div className="flex items-center gap-2">
                         {alert.channels.map(ch => (
                           <span key={ch} className="bg-primary/10 text-primary text-[9px] font-black px-2.5 py-1 rounded-md tracking-wider">
                             {ch}
                           </span>
                         ))}
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-bold">{alert.time}</span>
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
