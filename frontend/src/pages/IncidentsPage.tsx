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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase tracking-tight">Incident Management</h1>
          <p className="text-muted-foreground mt-1 font-medium">Manage and assign disaster incidents</p>
        </div>
        <button className="px-6 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-[1.02] transition-all active:scale-95">
          <Plus className="w-5 h-5" />
          Create Incident
        </button>
      </div>

      {/* Filters */}
      <div className="suraksha-card p-4 flex flex-wrap gap-4 items-center">
        <div className="flex gap-4">
          <select className="bg-muted/50 border border-border/50 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer min-w-[160px]">
            {severities.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="bg-muted/50 border border-border/50 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer min-w-[160px]">
            {statuses.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="bg-muted/50 border border-border/50 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer min-w-[160px]">
            {types.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="ml-auto relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search incident ID, location..." 
            className="w-full bg-muted/30 border border-border/50 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      <div className="suraksha-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-muted/20">
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-muted-foreground/80">ID</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-muted-foreground/80">Type</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-muted-foreground/80">Location</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-muted-foreground/80 text-center">Severity</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-muted-foreground/80 text-center">Status</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-muted-foreground/80 text-center">ML Score</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-muted-foreground/80 text-center">Time</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-muted-foreground/80 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {incidents.map((incident) => (
                <tr key={incident.id} className="hover:bg-primary/[0.02] transition-colors group">
                  <td className="px-6 py-5 text-sm font-bold text-muted-foreground/80">{incident.id}</td>
                  <td className="px-6 py-5 text-sm font-bold text-foreground">{incident.type}</td>
                  <td className="px-6 py-5 text-sm font-medium text-muted-foreground">{incident.location}</td>
                  <td className="px-6 py-5 text-center">
                    <span className={cn(
                      "inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase",
                      incident.severity === 'CRITICAL' ? 'bg-red-100 text-red-600' :
                      incident.severity === 'HIGH' ? 'bg-orange-100 text-orange-600' :
                      incident.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-green-100 text-green-600'
                    )}>
                      {incident.severity}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={cn(
                      "inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase",
                      incident.status === 'PENDING' ? 'bg-yellow-100 text-yellow-600' :
                      incident.status === 'IN PROGRESS' ? 'bg-blue-100 text-blue-600' :
                      incident.status === 'ASSIGNED' ? 'bg-cyan-100 text-cyan-600' :
                      'bg-green-100 text-green-600'
                    )}>
                      {incident.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center text-sm font-black text-primary">{incident.mlScore}</td>
                  <td className="px-6 py-5 text-center text-[11px] font-bold text-muted-foreground whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      {incident.time}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors group/btn">
                        <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                      </button>
                      <button className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors group/btn">
                        <FileEdit className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
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
