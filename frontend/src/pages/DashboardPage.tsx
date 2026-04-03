import React from 'react'
import { AlertCircle, Users, Bell, Clock, ArrowUpRight, ArrowDownRight, MapPin, ChevronRight, Globe, Filter } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ImpactMap } from '@/components/map/ImpactMap'
import { cn } from '@/lib/utils'

const stats = [
  { 
    label: 'Active Incidents', 
    value: '12', 
    trend: '+3', 
    trendUp: true, 
    icon: AlertCircle, 
    color: 'text-red-500', 
    bg: 'bg-red-50',
    dotColor: 'bg-red-500'
  },
  { 
    label: 'Volunteers Active', 
    value: '84', 
    trend: '+12', 
    trendUp: true, 
    icon: Users, 
    color: 'text-green-500', 
    bg: 'bg-green-50',
    dotColor: 'bg-green-500'
  },
  { 
    label: 'Pending Alerts', 
    value: '3', 
    trend: '-2', 
    trendUp: false, 
    icon: Bell, 
    color: 'text-orange-500', 
    bg: 'bg-orange-50',
    dotColor: 'bg-orange-500'
  },
  { 
    label: 'Avg Response Time', 
    value: '14m', 
    trend: '-3m', 
    trendUp: false, 
    icon: Clock, 
    color: 'text-blue-500', 
    bg: 'bg-blue-50',
    dotColor: 'bg-blue-500'
  },
]

const incidents = [
  {
    id: '#INC-1245',
    type: 'Flash Flood',
    location: 'Colombo 7, Bambalapitiya',
    priority: 'CRITICAL',
    status: 'PENDING',
    time: '5 min ago',
    mlScore: 0.95
  },
  {
    id: '#INC-1244',
    type: 'Landslide',
    location: 'Kandy District',
    priority: 'HIGH',
    status: 'PENDING',
    time: '15 min ago',
    mlScore: 0.87
  },
  {
    id: '#INC-1243',
    type: 'Building Collapse',
    location: 'Dehiwala',
    priority: 'HIGH',
    status: 'IN PROGRESS',
    time: '1 hour ago',
    mlScore: 0.82
  },
  {
    id: '#INC-1242',
    type: 'Medical Emergency',
    location: 'Wellawatta',
    priority: 'MEDIUM',
    status: 'ASSIGNED',
    time: '2 hours ago',
    mlScore: 0.65
  },
]

const recentAlerts = [
  { title: 'Flash Flood Warning', location: 'Colombo 7', time: '10 min ago', recipients: 2340 },
  { title: 'Landslide Risk', location: 'Kandy', time: '1 hour ago', recipients: 1520 },
  { title: 'Severe Weather', location: 'Galle', time: '3 hours ago', recipients: 3100 },
]

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground mt-1">Real-time disaster management overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="suraksha-card p-6 flex flex-col items-start relative overflow-hidden group hover:border-primary/30 transition-all cursor-default">
            <div className={cn("p-3 rounded-2xl mb-4 transition-transform group-hover:scale-110", stat.bg)}>
              <stat.icon className={cn("w-6 h-6", stat.color)} />
            </div>
            <div className="flex items-baseline justify-between w-full">
              <h3 className="text-3xl font-bold tracking-tight">{stat.value}</h3>
              <div className={cn(
                "flex items-center text-xs font-bold px-2 py-1 rounded-lg",
                stat.trendUp ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
              )}>
                {stat.trendUp ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                {stat.trend}
              </div>
            </div>
            <p className="text-sm font-medium text-muted-foreground mt-1">{stat.label}</p>
            
            {/* Background Decoration */}
            <div className={cn("absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-5 group-hover:opacity-10 transition-opacity", stat.dotColor)} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ML Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-bold flex items-center gap-2">
              ML-Sorted Priority Queue
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Automated</span>
            </h3>
            <button className="text-sm font-semibold text-muted-foreground flex items-center gap-2 hover:text-primary transition-colors">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>
          
          <div className="space-y-4">
            {incidents.map((incident) => (
              <div key={incident.id} className="suraksha-card p-5 group hover:border-primary/20 transition-all cursor-pointer">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground">{incident.id}</span>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-1 rounded-md tracking-wider",
                      incident.priority === 'CRITICAL' ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"
                    )}>
                      {incident.priority}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5" /> {incident.time}
                  </span>
                </div>
                
                <h4 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{incident.type}</h4>
                
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-medium">{incident.location}</span>
                </div>
                
                <div className="flex items-center justify-between border-t border-border/50 pt-4">
                  <span className={cn(
                    "text-[10px] font-bold px-3 py-1.5 rounded-lg tracking-widest",
                    incident.status === 'PENDING' ? "bg-yellow-100 text-yellow-600" : 
                    incident.status === 'IN PROGRESS' ? "bg-blue-100 text-blue-600" : "bg-cyan-100 text-cyan-600"
                  )}>
                    {incident.status}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground">ML Score:</span>
                    <span className="text-sm font-bold text-primary">{incident.mlScore}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Alerts & Map Preview */}
        <div className="space-y-8">
          <div className="suraksha-card overflow-hidden flex flex-col h-fit">
            <div className="p-5 border-b border-border/50">
              <h3 className="font-bold text-lg">Recent Alerts</h3>
            </div>
            <div className="p-5 space-y-6">
              {recentAlerts.map((alert, idx) => (
                <div key={idx} className="flex gap-4 group">
                  <div className="w-1.5 h-12 bg-primary/20 rounded-full bg-gradient-to-b from-primary to-primary/20" />
                  <div className="flex-1 space-y-1">
                    <h5 className="font-bold text-sm group-hover:text-primary transition-colors">{alert.title}</h5>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium uppercase tracking-tight">
                      <MapPin className="w-3 h-3" /> {alert.location}
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground/60 pt-1">
                      <span>{alert.time}</span>
                      <span>{alert.recipients.toLocaleString()} recipients</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full p-4 text-sm font-bold text-primary hover:bg-primary/5 transition-colors border-t border-border/50 flex items-center justify-center gap-2">
              View All Alerts <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="suraksha-card p-5 h-80 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">GIS Impact Map Preview</h3>
              <Link to="/map" className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                Open Full Map <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex-1 bg-muted/30 rounded-xl relative overflow-hidden border border-border/50 group">
              <ImpactMap />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-xl border border-white/20 shadow-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <Globe className="text-white w-4 h-4" />
                  </div>
                  <div>
                    <h6 className="text-[11px] font-bold text-foreground">Interactive GIS Map</h6>
                    <p className="text-[9px] text-muted-foreground font-bold">12 incidents • 84 volunteers</p>
                  </div>
                </div>
                <div className="flex -space-x-2">
                   {[1, 2, 3].map(i => (
                     <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-muted" />
                   ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
