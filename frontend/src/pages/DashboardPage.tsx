import { 
  AlertTriangle, Users, Clock, Heart, Package, LayoutGrid, 
  TrendingUp, TrendingDown, Download, Filter, MapPin, 
  Building2, ChevronRight 
} from 'lucide-react'
import { cn } from '@/lib/utils'

const mainStats = [
  { label: 'Active Incidents', value: '12', trend: '+3', isUp: true, icon: AlertTriangle, color: 'text-red-500', blob: 'bg-red-400' },
  { label: 'Volunteers Active', value: '84', trend: '+12', isUp: true, icon: Users, color: 'text-green-600', blob: 'bg-green-400' },
  { label: 'Relief Camps', value: '12', trend: '+2', isUp: true, icon: Building2, color: 'text-purple-600', blob: 'bg-purple-400' },
  { label: 'Avg Response Time', value: '14m', trend: '-3m', isUp: false, icon: Clock, color: 'text-blue-600', blob: 'bg-blue-400' },
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

const mlQueue = [
  { id: '#INC-1245', type: 'Flash Flood', location: 'Colombo 7, Bambalapitiya', priority: 'CRITICAL', time: '5 min ago', status: 'PENDING', score: '0.95' },
  { id: '#INC-1244', type: 'Landslide', location: 'Kandy District', priority: 'HIGH', time: '15 min ago', status: 'PENDING', score: '0.87' },
  { id: '#INC-1243', type: 'Building Collapse', location: 'Dehiwala', priority: 'HIGH', time: '1 hour ago', status: 'IN PROGRESS', score: '0.82' },
  { id: '#INC-1242', type: 'Medical Emergency', location: 'Wellawatta', priority: 'MEDIUM', time: '2 hours ago', status: 'ASSIGNED', score: '0.65' },
]

const recentAlerts = [
  { title: 'Flash Flood Warning', location: 'Colombo 7', time: '10 min ago', recipients: '2340 recipients' },
  { title: 'Landslide Risk', location: 'Kandy', time: '1 hour ago', recipients: '1520 recipients' },
  { title: 'Severe Weather', location: 'Galle', time: '3 hours ago', recipients: '3100 recipients' },
]

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1e293b]">Dashboard</h1>
          <p className="text-slate-500 mt-1 font-medium">Real-time disaster management overview</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-[#0061ff] text-white rounded-xl text-sm font-medium shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all active:scale-95 shadow-[0_8px_20px_-6px_rgba(0,97,255,0.4)]">
          <Download className="w-4 h-4" />
          Export Report
        </button>
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
                "flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg",
                stat.isUp ? "text-green-600" : "text-red-500"
              )}>
                {stat.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {stat.trend}
              </div>
            </div>
            <div className="relative z-10">
              <div className="text-4xl font-bold text-[#1e293b] mb-1">{stat.value}</div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {secondaryStats.map((stat, i) => (
          <div key={i} className={cn("p-6 rounded-[1.5rem] border transition-all hover:shadow-lg flex items-center gap-5", stat.cardClass)}>
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110", stat.color)}>
              <stat.icon className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-[#1e293b]">{stat.value}</span>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-tight">{stat.label}</span>
                </div>
                <div className={cn("text-[11px] font-medium mt-1", stat.footerColor)}>{stat.subtext}</div>
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
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors text-blue-600 font-semibold text-sm">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
          
          <div className="space-y-4">
            {mlQueue.map((item, idx) => (
              <div key={idx} className="p-6 border border-slate-50 rounded-2xl hover:border-blue-100 hover:bg-blue-50/10 transition-all group cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{item.id}</span>
                    <span className={cn(
                      "text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-tight",
                      item.priority === 'CRITICAL' ? "bg-red-50 text-red-500" : 
                      item.priority === 'HIGH' ? "bg-orange-50 text-orange-500" :
                      "bg-yellow-50 text-yellow-600"
                    )}>{item.priority}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                    <Clock className="w-4 h-4 text-slate-300" />
                    {item.time}
                  </div>
                </div>
                
                <h4 className="text-2xl font-bold text-[#1e293b] group-hover:text-[#0061ff] transition-colors leading-tight">{item.type}</h4>
                
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-400 mt-2">
                  <MapPin className="w-4 h-4 text-slate-300" />
                  {item.location}
                </div>

                <div className="h-px bg-slate-50 my-5" />

                <div className="flex items-center justify-between">
                  <span className={cn(
                    "text-[11px] font-semibold px-4 py-1.5 rounded-lg uppercase tracking-widest",
                    item.status === 'PENDING' ? "bg-amber-50 text-amber-600 border border-amber-100/50" :
                    item.status === 'IN PROGRESS' ? "bg-blue-50 text-blue-600 border border-blue-100/50" :
                    item.status === 'ASSIGNED' ? "bg-teal-50 text-teal-600 border border-teal-100/50" :
                    "bg-slate-50 text-slate-500"
                  )}>{item.status}</span>
                  <div className="text-xs font-semibold text-slate-400">
                    ML Score: <span className="text-[#0061ff] font-semibold text-sm ml-1">{item.score}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Alerts Widget */}
        <div className="suraksha-card p-8">
          <h3 className="text-xl font-bold text-[#1e293b] mb-8">Recent Alerts</h3>
          <div className="space-y-4">
            {recentAlerts.map((alert, idx) => (
              <div key={idx} className="p-5 border border-slate-50 rounded-2xl hover:border-blue-100 hover:bg-blue-50/30 transition-all group">
                <h4 className="text-[16px] font-bold text-[#1e293b] leading-tight group-hover:text-[#0061ff] transition-colors mb-2">{alert.title}</h4>
                
                <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-slate-300" />
                  {alert.location}
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 uppercase tracking-tight">
                    <Clock className="w-3.5 h-3.5 text-slate-300" />
                    {alert.time}
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md">{alert.recipients}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-4 px-6 border-2 border-slate-50 rounded-2xl text-[11px] font-semibold text-slate-400 uppercase tracking-widest hover:border-[#0061ff] hover:text-[#0061ff] transition-all">
            View All Broadcasts
          </button>
        </div>
      </div>

      {/* GIS Impact Map Preview */}
      <div className="suraksha-card p-8">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold text-[#1e293b]">GIS Impact Map Preview</h3>
          <button className="flex items-center gap-2 text-blue-600 font-semibold text-sm hover:underline transition-all">
            Open Full Map
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="relative h-[400px] w-full bg-[#e0f2fe] rounded-[2rem] overflow-hidden border-4 border-white shadow-inner flex items-center justify-center">
          {/* Stylized Map Elements */}
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none" />
          
          {/* Centered Large Marker */}
          <div className="flex flex-col items-center gap-2 transform -translate-y-4">
            <div className="p-4 bg-white rounded-full shadow-2xl animate-bounce">
              <MapPin className="w-10 h-10 text-blue-600 fill-blue-50" />
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-[#1e293b]">Interactive GIS Map</div>
              <div className="text-sm font-semibold text-slate-500">12 incidents • 84 volunteers</div>
            </div>
          </div>

          {/* Scattered Markers */}
          <div className="absolute top-[20%] left-[10%] w-4 h-4 bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse" />
          <div className="absolute top-[40%] right-[15%] w-5 h-5 bg-orange-500 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
          <div className="absolute bottom-[25%] left-[20%] w-3 h-3 bg-yellow-400 rounded-full" />
          <div className="absolute bottom-[30%] right-[10%] w-3 h-3 bg-green-500 rounded-full" />

          {/* Map Legend Overlay */}
          <div className="absolute bottom-6 left-6 p-5 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-100 shadow-xl space-y-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-xs font-medium text-slate-600 group-hover:text-blue-600 transition-colors">Incidents</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-300 text-pink-600 focus:ring-pink-500" />
              <span className="text-xs font-medium text-slate-600 group-hover:text-pink-600 transition-colors">Heatmap</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500" />
              <span className="text-xs font-medium text-slate-600 group-hover:text-green-600 transition-colors">Volunteers</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
