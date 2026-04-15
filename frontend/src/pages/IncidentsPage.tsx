import { Plus, Eye, FileEdit, Search, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

const incidents = [
  { id: '#INC-1245', type: 'Flash Flood', location: 'Colombo 7', severity: 'CRITICAL', status: 'PENDING', mlScore: 0.95, time: '5 min ago' },
  { id: '#INC-1244', type: 'Landslide', location: 'Kandy District', severity: 'HIGH', status: 'PENDING', mlScore: 0.87, time: '15 min ago' },
  { id: '#INC-1243', type: 'Building Collapse', location: 'Dehiwala', severity: 'HIGH', status: 'IN PROGRESS', mlScore: 0.82, time: '1 hour ago' },
  { id: '#INC-1242', type: 'Medical Emergency', location: 'Wellawatta', severity: 'MEDIUM', status: 'ASSIGNED', mlScore: 0.65, time: '2 hours ago' },
  { id: '#INC-1241', type: 'Fire', location: 'Mount Lavinia', severity: 'MEDIUM', status: 'RESOLVED', mlScore: 0.58, time: '5 hours ago' },
]

const severities = ['All Severities', 'Critical', 'High', 'Medium', 'Low']
const statuses = ['All Status', 'Pending', 'In Progress', 'Assigned', 'Resolved']
const types = ['All Types', 'Flood', 'Landslide', 'Fire', 'Building Collapse']

export default function IncidentsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#1e293b]">Incident Management</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage and assign disaster incidents</p>
        </div>
        <button className="px-6 py-3 bg-[#0061ff] text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-transform hover:scale-[1.02] active:scale-95">
          <Plus className="w-5 h-5" />
          Create Incident
        </button>
      </div>

      {/* Filters */}
      <div className="suraksha-card p-6 flex flex-wrap gap-4 items-center bg-white border border-slate-200 shadow-sm">
        <div className="flex gap-4">
          <div className="relative group">
            <select className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-[13px] font-black appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/10 cursor-pointer min-w-[180px] text-[#1e293b]">
              {severities.map(s => <option key={s}>{s}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative group">
            <select className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-[13px] font-black appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/10 cursor-pointer min-w-[180px] text-[#1e293b]">
              {statuses.map(s => <option key={s}>{s}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative group">
            <select className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-[13px] font-black appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/10 cursor-pointer min-w-[180px] text-[#1e293b]">
              {types.map(t => <option key={t}>{t}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div className="ml-auto relative w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search incident ID, location..." 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-300"
          />
        </div>
      </div>

      <div className="suraksha-card overflow-hidden border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">ID</th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Type</th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Location</th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 text-center">Severity</th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 text-center">Status</th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 text-center">ML Score</th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 text-center">Time</th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {incidents.map((incident) => (
                <tr key={incident.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-6 text-sm font-black text-slate-400 uppercase tracking-widest">{incident.id}</td>
                  <td className="px-8 py-6 text-sm font-black text-[#1e293b] group-hover:text-blue-600 transition-colors">{incident.type}</td>
                  <td className="px-8 py-6 text-sm font-bold text-slate-500">{incident.location}</td>
                  <td className="px-8 py-6 text-center">
                    <span className={cn(
                      "inline-flex items-center px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase border",
                      incident.severity === 'CRITICAL' ? 'bg-red-50 text-red-600 border-red-100' :
                      incident.severity === 'HIGH' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                      incident.severity === 'MEDIUM' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                      'bg-green-50 text-green-700 border-green-100'
                    )}>
                      {incident.severity}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={cn(
                      "inline-flex items-center px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase border",
                      incident.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                      incident.status === 'IN PROGRESS' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                      incident.status === 'ASSIGNED' ? 'bg-cyan-50 text-cyan-700 border-cyan-100' :
                      'bg-green-50 text-green-700 border-green-100'
                    )}>
                      {incident.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center text-sm font-black text-blue-600 tracking-tight">{incident.mlScore}</td>
                  <td className="px-8 py-6 text-center text-[11px] font-bold text-slate-400 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4 text-slate-300" />
                      {incident.time}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button className="text-slate-300 hover:text-blue-600 transition-colors">
                        <Eye className="w-5 h-5" />
                      </button>
                      <button className="text-slate-300 hover:text-[#0061ff] transition-colors">
                        <FileEdit className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const ChevronDown = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
)
