import { Search, UserPlus, Eye, Trash2, ChevronDown, UserCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

const users = [
  { 
    id: 1, 
    name: 'Deshan Silva', 
    email: 'deshan@example.com', 
    role: 'VOLUNTEER', 
    status: 'ACTIVE', 
    tasks: 23, 
    joined: '2 months ago' 
  },
  { 
    id: 2, 
    name: 'Amaya Fernando', 
    email: 'amaya@example.com', 
    role: 'VOLUNTEER', 
    status: 'ACTIVE', 
    tasks: 18, 
    joined: '3 months ago' 
  },
  { 
    id: 3, 
    name: 'Kamal Perera', 
    email: 'kamal@example.com', 
    role: 'VOLUNTEER', 
    status: 'PENDING', 
    tasks: 0, 
    joined: '1 day ago' 
  },
  { 
    id: 4, 
    name: 'Nimal Rajapaksa', 
    email: 'nimal@dmc.lk', 
    role: 'DMC OFFICER', 
    status: 'ACTIVE', 
    tasks: 156, 
    joined: '1 year ago' 
  },
  { 
    id: 5, 
    name: 'Chaminda Wickramasinghe', 
    email: 'chaminda@example.com', 
    role: 'VOLUNTEER', 
    status: 'ACTIVE', 
    tasks: 31, 
    joined: '5 months ago' 
  },
]

const stats = [
  { label: 'Total Volunteers', value: '110', color: 'text-blue-600' },
  { label: 'Active Now', value: '84', color: 'text-green-600' },
  { label: 'Pending Approval', value: '15', color: 'text-orange-500' },
  { label: 'DMC Officers', value: '8', color: 'text-purple-600' },
]

export default function UserManagementPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1e293b]">User Management</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage volunteers and DMC officers</p>
        </div>
        <button className="px-6 py-3 bg-[#0061ff] text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/25 hover:scale-[1.02] transition-all active:scale-95">
          <UserPlus className="w-5 h-5" />
          Add DMC Officer
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white border border-slate-100 rounded-[1.5rem] p-10 flex flex-col items-center justify-center text-center space-y-2 hover:shadow-lg transition-all shadow-sm">
             <div className={cn("text-4xl font-bold", stat.color)}>{stat.value}</div>
             <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="bg-white border border-slate-100 rounded-[1.5rem] p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
         <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-48 group">
               <select className="appearance-none w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 pr-10 text-sm font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer">
                  <option>All Roles</option>
                  <option>Citizen</option>
                  <option>Volunteer</option>
                  <option>DMC Officer</option>
                  <option>Admin</option>
               </select>
               <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-focus-within:rotate-180 transition-transform" />
            </div>

            <div className="relative w-full md:w-48 group">
               <select className="appearance-none w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 pr-10 text-sm font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer">
                  <option>All Status</option>
                  <option>Active</option>
                  <option>Pending</option>
                  <option>Inactive</option>
               </select>
               <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-focus-within:rotate-180 transition-transform" />
            </div>
         </div>

         <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search users..." 
              className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
         </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-slate-100 rounded-[1.5rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">Name</th>
                <th className="px-8 py-5 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">Email</th>
                <th className="px-12 py-5 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">Role</th>
                <th className="px-8 py-5 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">Status</th>
                <th className="px-8 py-5 text-center text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">Tasks</th>
                <th className="px-8 py-5 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">Joined</th>
                <th className="px-8 py-5 text-center text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((user, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="text-sm font-bold text-[#1e293b]">{user.name}</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-sm font-semibold text-slate-400">{user.email}</div>
                  </td>
                  <td className="px-12 py-6">
                    <span className={cn(
                      "text-[10px] font-bold px-3 py-1.5 rounded-full tracking-wide",
                      user.role === 'VOLUNTEER' ? "bg-green-50 text-green-600" : 
                      user.role === 'DMC OFFICER' ? "bg-purple-50 text-purple-600" :
                      "bg-slate-100 text-slate-600"
                    )}>{user.role}</span>
                  </td>
                  <td className="px-8 py-6 text-left">
                    <span className={cn(
                      "text-[11px] font-bold uppercase tracking-tight",
                      user.status === 'ACTIVE' ? "text-green-600" : 
                      user.status === 'PENDING' ? "bg-amber-50 px-2 py-1 rounded-lg text-amber-600" :
                      "text-slate-400"
                    )}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="text-sm font-bold text-blue-600">{user.tasks}</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm font-semibold text-slate-400">{user.joined}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-5">
                       {user.status === 'PENDING' && (
                         <button className="text-green-500 hover:scale-110 transition-transform" title="Approve">
                            <UserCheck className="w-5 h-5" />
                         </button>
                       )}
                      <button className="text-blue-500 hover:scale-110 transition-transform" title="View details">
                        <Eye className="w-5 h-5" />
                      </button>
                      <button className="text-red-400 hover:text-red-500 hover:scale-110 transition-transform" title="Delete">
                        <Trash2 className="w-5 h-5" />
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
