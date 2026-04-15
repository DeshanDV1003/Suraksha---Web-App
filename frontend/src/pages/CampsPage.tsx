import { 
  Building2, Users, PieChart, AlertTriangle, 
  Utensils, Droplets, Heart, Zap, Bath, 
  UserCheck, Baby, Accessibility, Clock, MapPin, Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'

const stats = [
  { label: 'Active Camps', value: '12', color: 'text-blue-600' },
  { label: 'People Sheltered', value: '1,240', color: 'text-green-600' },
  { label: 'Avg Occupancy', value: '68%', color: 'text-orange-600' },
  { label: 'Near Capacity', value: '3', color: 'text-red-600' },
]

const teams = [ // Assuming services mapped to lowercase names as per design
  { name: 'food', icon: Utensils },
  { name: 'water', icon: Droplets },
  { name: 'medical', icon: Heart },
  { name: 'charging', icon: Zap },
  { name: 'toilets', icon: Bath },
  { name: 'women', icon: UserCheck },
  { name: 'child-care', icon: Baby },
  { name: 'disability', icon: Accessibility },
]

const camps = [
  {
    name: 'Colombo Community Center',
    location: 'Colombo 7',
    occupancy: '85/120',
    percent: 71,
    status: 'MODERATE',
    statusColor: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    barColor: 'bg-yellow-500',
    services: ['food', 'water', 'medical', 'charging', 'toilets', 'women', 'child-care'],
    waitTime: '15 min'
  },
  {
    name: 'Dehiwala School Hall',
    location: 'Dehiwala',
    occupancy: '110/120',
    percent: 92,
    status: 'HIGH',
    statusColor: 'bg-red-50 text-red-600 border-red-100',
    barColor: 'bg-red-500',
    services: ['food', 'water', 'toilets', 'child-care', 'disability'],
    waitTime: '30 min'
  },
  {
    name: 'Wellawatta Temple',
    location: 'Wellawatta',
    occupancy: '95/100',
    percent: 95,
    status: 'MODERATE',
    statusColor: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    barColor: 'bg-red-500', // Design shows red bar even for moderate if near 100%
    services: ['food', 'water', 'medical', 'women'],
    waitTime: '20 min'
  },
  {
    name: 'Mount Lavinia Community Hall',
    location: 'Mount Lavinia',
    occupancy: '45/80',
    percent: 56,
    status: 'LOW',
    statusColor: 'bg-green-50 text-green-600 border-green-100',
    barColor: 'bg-green-500',
    services: ['food', 'water', 'charging', 'toilets'],
    waitTime: '5 min'
  },
]

export default function CampsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1e293b]">Relief Camp Management</h1>
          <p className="text-slate-500 mt-1 font-medium">Service availability and crowd management</p>
        </div>
        <button className="px-6 py-3 bg-[#0061ff] text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/25 hover:scale-[1.02] transition-all active:scale-95">
          <Plus className="w-5 h-5" />
          Add Camp
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white border border-slate-100 rounded-[1.25rem] p-7 flex flex-col items-center justify-center text-center space-y-1 hover:shadow-lg transition-all shadow-sm">
             <div className={cn("text-3xl font-bold", stat.color)}>{stat.value}</div>
             <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Camps Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {camps.map((camp, idx) => (
          <div key={idx} className="bg-white border border-slate-100 rounded-[1.5rem] p-7 flex flex-col space-y-6 hover:shadow-xl transition-all shadow-sm relative group">
            {/* Severity Pill - Top Right */}
            <div className="absolute top-7 right-7">
               <span className={cn(
                 "text-[10px] font-bold px-3 py-1 rounded-full tracking-wide uppercase border",
                 camp.statusColor
               )}>
                 {camp.status}
               </span>
            </div>

            {/* Camp Name & Location */}
            <div className="pr-20">
              <h3 className="text-xl font-bold text-[#1e293b]">{camp.name}</h3>
              <div className="flex items-center gap-2 text-sm text-slate-400 font-semibold mt-1">
                <MapPin className="w-4 h-4 text-slate-300" />
                {camp.location}
              </div>
            </div>

            {/* Occupancy Section */}
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-[13px] font-semibold text-slate-400">Occupancy</span>
                <span className="text-sm font-bold text-[#1e293b]">{camp.occupancy} ({camp.percent}%)</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full transition-all duration-1000", camp.barColor)} style={{ width: `${camp.percent}%` }} />
              </div>
            </div>

            {/* Services List */}
            <div className="space-y-3">
              <span className="text-[13px] font-semibold text-slate-400">Available Services</span>
              <div className="flex flex-wrap gap-2">
                {camp.services.map((sName) => {
                  const s = teams.find(t => t.name === sName);
                  if (!s) return null;
                  return (
                    <div key={sName} className="flex items-center gap-1.5 bg-blue-50/70 text-blue-600 px-3 py-1 rounded-lg border border-blue-100/50">
                      <s.icon className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-bold lowercase">{sName}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer with Wait Time */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between mt-auto">
               <div className="flex items-center gap-2 text-slate-400">
                  <Clock className="w-4 h-4 text-slate-300" />
                  <span className="text-sm font-semibold">Wait time: <span className="text-[#1e293b] font-bold">{camp.waitTime}</span></span>
               </div>
               <button className="text-sm font-bold text-[#0061ff] hover:underline">
                 View Details
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
