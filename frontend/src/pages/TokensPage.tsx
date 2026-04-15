import { QrCode, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

const stats = [
  { label: 'Tokens Issued', value: '842', color: 'text-blue-600' },
  { label: 'Items Distributed', value: '1,245', color: 'text-green-600' },
  { label: 'Duplicate Prevented', value: '23', color: 'text-orange-600' },
  { label: 'Scan Success Rate', value: '98.5%', color: 'text-purple-600' },
]

const recentDistributions = [
  {
    id: 'SRK-2024-001234',
    name: 'Deshan Silva',
    item: 'Food Package',
    location: 'Colombo Community Center',
    status: 'SUCCESS',
    time: '10 min ago'
  },
  {
    id: 'SRK-2024-001235',
    name: 'Amaya Fernando',
    item: 'Water (20L)',
    location: 'Dehiwala School',
    status: 'SUCCESS',
    time: '15 min ago'
  },
  {
    id: 'SRK-2024-001236',
    name: 'Kamal Perera',
    item: 'Medicine',
    location: 'Colombo Community Center',
    status: 'DUPLICATE',
    time: '25 min ago'
  },
  {
    id: 'SRK-2024-001237',
    name: 'Nimal Rajapaksa',
    item: 'Food Package',
    location: 'Wellawatta Temple',
    status: 'SUCCESS',
    time: '1 hour ago'
  },
]

export default function TokensPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1e293b]">Digital Token System</h1>
          <p className="text-slate-500 mt-1 font-medium">QR-based fair distribution and tracking</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-[#0061ff] text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/25 hover:scale-[1.02] transition-all active:scale-95">
          <QrCode className="w-5 h-5" />
          Generate New Token
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white border border-slate-100 rounded-[1.25rem] p-7 flex flex-col items-center justify-center text-center space-y-1 hover:shadow-lg transition-all shadow-sm">
             <div className={cn("text-3xl font-bold", stat.color)}>{stat.value}</div>
             <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Distributions List Container */}
      <div className="bg-white border border-slate-100 rounded-[1.5rem] p-10 space-y-8 shadow-sm">
        <h3 className="text-xl font-bold text-[#1e293b]">Recent Distributions</h3>
        <div className="space-y-5">
          {recentDistributions.map((dist, idx) => (
            <div 
              key={idx} 
              className={cn(
                "p-7 rounded-[1.5rem] bg-white border transition-all hover:shadow-md relative group",
                dist.status === 'SUCCESS' ? "border-blue-100/60" : "border-red-100/60"
              )}
            >
              {/* Status Badge - Top Right */}
              <div className="absolute top-7 right-7">
                <span className={cn(
                  "text-[10px] font-bold px-3 py-1.5 rounded-full tracking-wide uppercase",
                  dist.status === 'SUCCESS' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                )}>
                  {dist.status}
                </span>
              </div>

              {/* Card Content */}
              <div className="space-y-4">
                {/* ID Header */}
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-slate-300" />
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{dist.id}</span>
                </div>

                {/* Recipient Name */}
                <h4 className="text-xl font-bold text-[#1e293b]">{dist.name}</h4>

                {/* Distribution Details */}
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                  <span className="text-slate-600">{dist.item}</span>
                  <span className="text-slate-300">•</span>
                  <span>{dist.location}</span>
                </div>

                {/* Footer Separator & Time */}
                <div className="pt-4 border-t border-slate-50 flex items-center gap-2 text-[12px] font-semibold text-slate-400">
                  <Clock className="w-4 h-4 text-slate-300" />
                  <span>{dist.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
