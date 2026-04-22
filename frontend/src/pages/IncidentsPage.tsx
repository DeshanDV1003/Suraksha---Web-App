import { useEffect, useState } from 'react'
import { Plus, Eye, FileEdit, Search, Clock, CheckCircle2, AlertCircle, X, MapPin, AlertTriangle, Shield, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { incidentService } from '../services/api'
import { formatDistanceToNow } from 'date-fns'

const severities = ['All Severities', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
const statuses = ['All Status', 'PENDING', 'IN_PROGRESS', 'ASSIGNED', 'RESOLVED']

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('All Severities')
  const [statusFilter, setStatusFilter] = useState('All Status')
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState<any>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  useEffect(() => {
    fetchIncidents()
  }, [])

  const fetchIncidents = async () => {
    try {
      const res = await incidentService.getIncidents()
      setIncidents(res.data)
    } catch (err) {
      console.error('Failed to fetch incidents', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await incidentService.updateStatus(id, status)
      fetchIncidents()
    } catch (err) {
      console.error('Failed to update status', err)
    }
  }

  const handleDeleteIncident = async (id: string) => {
    if (!confirm('Are you sure you want to delete this incident report?')) return
    try {
      await incidentService.deleteIncident(id)
      fetchIncidents()
    } catch (err) {
      console.error('Failed to delete incident', err)
    }
  }

  const filteredIncidents = incidents.filter(i => {
    const matchesSearch = i.title.toLowerCase().includes(search.toLowerCase()) || i.location.toLowerCase().includes(search.toLowerCase())
    const matchesSeverity = severityFilter === 'All Severities' || i.severity === severityFilter
    const matchesStatus = statusFilter === 'All Status' || i.status === statusFilter
    return matchesSearch && matchesSeverity && matchesStatus
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#1e293b]">Incident Management</h1>
          <p className="text-slate-500 mt-1 font-medium italic">Command Center response pipeline</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="suraksha-button flex items-center gap-2 group"
        >
          <div className="bg-white/20 p-1.5 rounded-lg group-hover:bg-white/30 transition-colors">
            <Plus className="w-4 h-4" />
          </div>
          Register New Incident
        </button>
      </div>

      {/* Filters */}
      <div className="suraksha-card p-6 flex flex-wrap gap-4 items-center bg-white/80 backdrop-blur-sm">
        <div className="flex gap-4">
          <div className="relative group">
            <select 
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-slate-50 border border-slate-100 rounded-xl px-5 py-3 text-[11px] font-black appearance-none focus:outline-none focus:ring-2 focus:ring-[#0061ff]/10 cursor-pointer min-w-[150px] text-[#1e293b] uppercase tracking-widest"
            >
              {severities.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative group">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-100 rounded-xl px-5 py-3 text-[11px] font-black appearance-none focus:outline-none focus:ring-2 focus:ring-[#0061ff]/10 cursor-pointer min-w-[150px] text-[#1e293b] uppercase tracking-widest"
            >
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div className="ml-auto relative w-80">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          <input 
            type="text" 
            placeholder="Search by title, location or ID..." 
            className="suraksha-input pl-14"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="suraksha-card overflow-hidden shadow-2xl shadow-blue-500/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100/50">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tracker ID</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Incident Details</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Priority</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Review Status</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">ML Confidence</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Age</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/50 font-bold">
              {loading ? (
                <tr>
                   <td colSpan={7} className="px-8 py-20 text-center">
                     <div className="flex flex-col items-center gap-3">
                       <div className="w-8 h-8 border-4 border-[#0061ff]/20 border-t-[#0061ff] rounded-full animate-spin" />
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Synchronizing Encrypted Data...</span>
                     </div>
                   </td>
                </tr>
              ) : filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center text-slate-400 uppercase tracking-widest text-[11px] font-black italic">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                      <AlertCircle className="w-12 h-12" />
                      Zero Incident Records on Current Pipeline
                    </div>
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-blue-50/[0.15] transition-all group border-l-4 border-l-transparent hover:border-l-[#0061ff]">
                    <td className="px-8 py-8 text-[11px] text-slate-400 uppercase tracking-widest font-black">#DM-{incident.id.slice(0, 6)}</td>
                    <td className="px-8 py-8">
                       <div className="text-base text-[#1e293b] font-black group-hover:text-[#0061ff] transition-colors flex items-center gap-2">
                         {incident.title}
                         {incident.severity === 'CRITICAL' && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                       </div>
                       <div className="text-[12px] text-slate-400 mt-1 font-bold flex items-center gap-1.5 leading-none">
                         <MapPin className="w-3 h-3 text-slate-300" />
                         {incident.location}
                       </div>
                    </td>
                    <td className="px-8 py-8 text-center text-sm font-bold text-slate-500">
                      <span className={cn(
                        "inline-flex items-center px-4 py-1.5 rounded-xl text-[9px] font-black tracking-[0.1em] uppercase border shadow-sm",
                        incident.severity === 'CRITICAL' ? 'bg-red-50 text-red-600 border-red-100 shadow-red-500/5' :
                        incident.severity === 'HIGH' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                        'bg-yellow-50 text-yellow-600 border-yellow-100 font-bold'
                      )}>
                        {incident.severity}
                      </span>
                    </td>
                    <td className="px-8 py-8 text-center">
                      <select 
                        value={incident.status}
                        onChange={(e) => handleUpdateStatus(incident.id, e.target.value)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[9px] font-black tracking-[0.1em] uppercase border cursor-pointer outline-none transition-all shadow-sm",
                          incident.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          incident.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                          incident.status === 'ASSIGNED' ? 'bg-teal-50 text-teal-700 border-teal-100' :
                          'bg-green-50 text-green-700 border-green-100'
                        )}
                      >
                        {statuses.filter(s => s !== 'All Status').map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                      </select>
                    </td>
                    <td className="px-8 py-8 text-center text-sm font-black text-blue-600 tracking-tighter">98.4%</td>
                    <td className="px-8 py-8 text-center text-[10px] font-black text-slate-400 whitespace-nowrap uppercase tracking-widest">
                      {formatDistanceToNow(new Date(incident.createdAt))}
                    </td>
                    <td className="px-8 py-8 text-right">
                      <div className="flex items-center justify-end gap-3 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                        <button 
                          onClick={() => { setSelectedIncident(incident); setIsDetailsModalOpen(true); }}
                          className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-white hover:text-[#0061ff] hover:shadow-xl hover:shadow-blue-500/10 transition-all border border-transparent hover:border-slate-100"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteIncident(incident.id)}
                          className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 transition-all border border-transparent"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(incident.id, 'RESOLVED')}
                           disabled={incident.status === 'RESOLVED'}
                          className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-500 hover:bg-green-100 transition-all border border-transparent disabled:opacity-20"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Incident Modal */}
      {isCreateModalOpen && (
        <CreateIncidentModal 
          onClose={() => setIsCreateModalOpen(false)} 
          onSuccess={() => { setIsCreateModalOpen(false); fetchIncidents(); }}
        />
      )}

      {/* Details Modal */}
      {isDetailsModalOpen && selectedIncident && (
        <IncidentDetailsModal 
          incident={selectedIncident} 
          onClose={() => setIsDetailsModalOpen(false)} 
        />
      )}
    </div>
  )
}

function CreateIncidentModal({ onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    severity: 'MEDIUM',
    category: 'FLOOD',
    latitude: 6.9271,
    longitude: 79.8612
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    try {
      await incidentService.createIncident(formData)
      onSuccess()
    } catch (err) {
      alert('Failed to register incident')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="suraksha-card w-full max-w-xl bg-white p-10 space-y-8 animate-in slide-in-from-bottom-8 duration-500 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-50 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#0061ff]">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#1e293b]">New Field Directive</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5 italic">Emergency Resource Protocol #SR-99</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-300 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
           <div className="grid grid-cols-2 gap-6">
             <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 italic">Directive Title</label>
                <input 
                  required
                  className="suraksha-input" 
                  placeholder="Flood Alert: Region 7 Sector B"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 italic">Incident Geo-Location</label>
                <input 
                  required
                  className="suraksha-input" 
                  placeholder="Galle Road, Colombo"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 italic">Category Classification</label>
                <select 
                  className="suraksha-input"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option value="FLOOD">Flood response</option>
                  <option value="LANDSLIDE">Landslide alert</option>
                  <option value="STORM">Storm management</option>
                  <option value="MEDICAL">Medical emergency</option>
                  <option value="FIRE">Fire hazard</option>
                </select>
             </div>
             <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 italic">Operational Briefing</label>
                <textarea 
                  required
                  className="suraksha-input min-h-[120px] py-4" 
                  placeholder="Provide detailed description of the situation, required resources, and population density at risk..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                ></textarea>
             </div>
           </div>

           <button 
             type="submit" 
             disabled={loading}
             className="suraksha-button w-full h-14 uppercase tracking-widest text-[11px] font-black shadow-blue-500/30"
           >
             {loading ? 'Transmitting Directive...' : 'Execute Field Directive'}
           </button>
        </form>
      </div>
    </div>
  )
}

function IncidentDetailsModal({ incident, onClose }: any) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="suraksha-card w-full max-w-4xl bg-white p-0 overflow-hidden animate-in zoom-in-95 duration-500 shadow-2xl rounded-[3rem]">
        <div className="grid grid-cols-1 md:grid-cols-2 h-full min-h-[500px]">
          {/* Info Side */}
          <div className="p-10 space-y-8 flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full uppercase tracking-widest">Incident Profile #{incident.id.slice(0, 8)}</span>
              <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl md:hidden">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-[#1e293b] leading-[1.1]">{incident.title}</h2>
              <div className="flex items-center gap-2 text-slate-500 font-bold">
                 <MapPin className="w-5 h-5 text-[#0061ff]" />
                 {incident.location}
              </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="space-y-1">
                   <div className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Priority Matrix</div>
                   <div className="font-black text-red-600 text-lg uppercase">{incident.severity}</div>
                </div>
                <div className="w-px h-10 bg-slate-100" />
                <div className="space-y-1">
                   <div className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Response Status</div>
                   <div className="font-black text-[#1e293b] text-lg uppercase">{incident.status}</div>
                </div>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-4">
               <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Operational Briefing</div>
               <p className="text-slate-600 leading-relaxed font-bold text-sm bg-slate-50 p-6 rounded-3xl border border-dashed border-slate-200">
                 {incident.description || 'No detailed briefing provided for this incident record. Please coordinate with field officers for live updates.'}
               </p>
            </div>

            <div className="pt-6 border-t border-slate-50 mt-auto flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-sm">
                    {incident.reporter?.name?.slice(0, 1) || 'C'}
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-[#1e293b]">{incident.reporter?.name || 'Emergency Dispatch'}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Reporting Agency / Official</div>
                  </div>
               </div>
               <div className="text-[10px] font-bold text-slate-300 italic">Reported {formatDistanceToNow(new Date(incident.createdAt))} ago</div>
            </div>
          </div>

          {/* Media / Map Side */}
          <div className="relative bg-slate-100 min-h-[300px] flex items-center justify-center overflow-hidden">
             {incident.images && incident.images.length > 0 ? (
               <img src={incident.images[0]} className="w-full h-full object-cover" alt="Incident" />
             ) : (
               <div className="text-center space-y-4 p-10">
                  <div className="p-6 bg-white/50 backdrop-blur rounded-[2.5rem] shadow-sm inline-block">
                    <AlertTriangle className="w-16 h-16 text-slate-300" />
                  </div>
                  <h4 className="text-lg font-black text-slate-400 uppercase tracking-widest">No Visual Intel Found</h4>
                  <p className="text-xs font-bold text-slate-400 max-w-[200px] mx-auto uppercase leading-loose">Imagery encryption pending or field upload failed</p>
               </div>
             )}
             <button onClick={onClose} className="absolute top-8 right-8 p-3 bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl hover:bg-white transition-all text-slate-900 hidden md:block">
               <X className="w-8 h-8" />
             </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const ChevronDown = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
)
