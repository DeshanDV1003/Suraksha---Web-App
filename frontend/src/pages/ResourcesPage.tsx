import { Package, Eye, Phone, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const stats = [
  { label: 'Boats Available', value: '23', color: 'text-blue-600' },
  { label: 'Vehicles', value: '15', color: 'text-green-600' },
  { label: 'Generators', value: '8', color: 'text-purple-600' },
  { label: 'Shelter Rooms', value: '34', color: 'text-orange-600' },
]

const resources = [
  { 
    type: 'Boat', 
    owner: 'Kamal Perera', 
    location: 'Colombo 7', 
    capacity: '6 people', 
    status: 'AVAILABLE',
    contact: '+94 77 123 4567'
  },
  { 
    type: 'Pickup Truck', 
    owner: 'Chaminda Silva', 
    location: 'Dehiwala', 
    capacity: '8 people', 
    status: 'IN USE',
    contact: '+94 77 234 5678'
  },
  { 
    type: 'Generator (5kW)', 
    owner: 'Nimal Fernando', 
    location: 'Wellawatta', 
    capacity: '5kW', 
    status: 'AVAILABLE',
    contact: '+94 77 345 6789'
  },
  { 
    type: 'Temporary Room', 
    owner: 'Amaya Rajapaksa', 
    location: 'Mount Lavinia', 
    capacity: '4 people', 
    status: 'AVAILABLE',
    contact: '+94 77 456 7890'
  },
  { 
    type: 'Water Filter', 
    owner: 'Sunil Jayawardena', 
    location: 'Nugegoda', 
    capacity: '50L/hour', 
    status: 'AVAILABLE',
    contact: '+94 77 567 8901'
  },
]

export default function ResourcesPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1e293b]">Community Resource Management</h1>
          <p className="text-slate-500 mt-1 font-medium">Crowdsourced resources from local community</p>
        </div>
        <button className="px-6 py-3 bg-[#0061ff] text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/25 hover:scale-[1.02] transition-all active:scale-95">
          <Plus className="w-5 h-5" />
          Add Resource
        </button>
      </div>

      {/* Mini Stats Grid - Reduced Size */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white border border-slate-100 rounded-[1.25rem] p-7 flex flex-col items-center justify-center text-center space-y-1 hover:shadow-lg transition-all shadow-sm">
             <div className={cn("text-3xl font-bold", stat.color)}>{stat.value}</div>
             <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Resources Table */}
      <div className="bg-white border border-slate-100 rounded-[1.5rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">Resource Type</th>
                <th className="px-8 py-5 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">Owner</th>
                <th className="px-8 py-5 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">Location</th>
                <th className="px-8 py-5 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">Capacity</th>
                <th className="px-8 py-5 text-center text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">Status</th>
                <th className="px-8 py-5 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">Contact</th>
                <th className="px-8 py-5 text-center text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {resources.map((resource, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <span className="text-sm font-bold text-[#1e293b] group-hover:text-[#0061ff] transition-colors whitespace-nowrap">{resource.type}</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm font-semibold text-slate-400">{resource.owner}</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm font-semibold text-slate-400 whitespace-nowrap">{resource.location}</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm font-semibold text-slate-400 whitespace-nowrap">{resource.capacity}</span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={cn(
                      "text-[10px] font-bold px-3 py-1.5 rounded-full tracking-wide whitespace-nowrap inline-block uppercase",
                      resource.status === 'AVAILABLE' ? "bg-green-50 text-green-600" : "bg-slate-100 text-slate-500"
                    )}>
                      {resource.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm font-semibold text-slate-400 whitespace-nowrap">{resource.contact}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-5">
                      <button className="text-blue-500 hover:scale-110 transition-transform" title="View details">
                        <Eye className="w-5 h-5" />
                      </button>
                      <button className="text-[#00AEEF] hover:scale-110 transition-transform" title="Call owner">
                        <Phone className="w-5 h-5" />
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
