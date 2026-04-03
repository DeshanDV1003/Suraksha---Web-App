import { Search, UserPlus, Eye, UserMinus, ChevronDown } from 'lucide-react'
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
  { label: 'Pending Approval', value: '15', color: 'text-orange-600' },
  { label: 'DMC Officers', value: '8', color: 'text-purple-600' },
]

export default function UserManagementPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-1 font-medium">Manage volunteers and DMC officers</p>
        </div>
        <button className="px-6 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95">
          <UserPlus className="w-5 h-5" />
          Add DMC Officer
        </button>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="suraksha-card p-8 flex flex-col items-center justify-center text-center space-y-2 group hover:border-primary/10 transition-all">
             <div className={cn("text-4xl font-black", stat.color)}>{stat.value}</div>
             <div className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-widest">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters & Table */}
      <div className="suraksha-card overflow-hidden">
        <div className="p-6 border-b border-border/40 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative group min-w-[160px]">
              <select className="w-full bg-white border border-border/60 rounded-xl px-4 py-2.5 text-sm font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-primary/10 cursor-pointer">
                <option>All Roles</option>
                <option>Citizen</option>
                <option>Volunteer</option>
                <option>DMC Officer</option>
                <option>Admin</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none group-hover:text-foreground transition-colors" />
            </div>

            <div className="relative group min-w-[160px]">
              <select className="w-full bg-white border border-border/60 rounded-xl px-4 py-2.5 text-sm font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-primary/10 cursor-pointer">
                <option>All Status</option>
                <option>Active</option>
                <option>Pending</option>
                <option>Inactive</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none group-hover:text-foreground transition-colors" />
            </div>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search users..."
              className="w-full bg-white border border-border/60 rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/40"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/5 border-b border-border/40">
                <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 w-[15%]">Name</th>
                <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 w-[25%]">Email</th>
                <th className="px-6 py-4 text-center text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 w-[15%]">Role</th>
                <th className="px-6 py-4 text-center text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 w-[12%]">Status</th>
                <th className="px-6 py-4 text-center text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 w-[10%]">Tasks</th>
                <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 w-[13%]">Joined</th>
                <th className="px-6 py-4 text-center text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 w-[10%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/10 transition-colors group">
                  <td className="px-6 py-5">
                    <span className="text-sm font-black text-foreground group-hover:text-primary transition-colors whitespace-nowrap">{user.name}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm font-bold text-muted-foreground">{user.email}</span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={cn(
                      "text-[9px] font-black px-2.5 py-1.5 rounded-full tracking-widest whitespace-nowrap inline-block",
                      user.role === 'VOLUNTEER' ? "bg-green-50 text-green-600" : "bg-purple-50 text-purple-600"
                    )}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={cn(
                      "text-[9px] font-black px-2.5 py-1.5 rounded-full tracking-widest whitespace-nowrap inline-block",
                      user.status === 'ACTIVE' ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"
                    )}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="text-sm font-black text-primary">{user.tasks}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm font-bold text-muted-foreground whitespace-nowrap">{user.joined}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-center gap-3">
                      <button className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors group/btn">
                        <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                      </button>
                      <button className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors group/btn">
                        <UserMinus className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
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
