import { Search, UserPlus, Eye, Trash2, ChevronDown, UserCheck, X, Shield, ShieldAlert, User, UserCog } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { userService } from '../services/api'
import { formatDistanceToNow } from 'date-fns'

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All Roles')
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await userService.getUsers()
      setUsers(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRole = async (id: string, role: string) => {
    try {
      await userService.updateRole(id, role)
      fetchUsers()
    } catch (err) {
      alert('Failed to update role')
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user? This action is irreversible.')) return
    try {
      await userService.deleteUser(id)
      fetchUsers()
    } catch (err) {
      alert('Failed to delete user')
    }
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'All Roles' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  const stats = [
    { label: 'Total Base', value: users.length.toString(), color: 'text-blue-600', icon: User },
    { label: 'DMC Personnel', value: users.filter(u => u.role === 'DMC_OFFICER').length.toString(), color: 'text-indigo-600', icon: Shield },
    { label: 'Field Volunteers', value: users.filter(u => u.role === 'VOLUNTEER').length.toString(), color: 'text-teal-600', icon: UserCheck },
    { label: 'Administrators', value: users.filter(u => u.role === 'ADMIN').length.toString(), color: 'text-rose-600', icon: ShieldAlert },
  ]

  return (
    <div className="space-y-10 animate-in fade-in duration-700 font-sans pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-[#1e293b]">Personnel Directory</h1>
          <p className="text-slate-500 mt-1 font-bold uppercase text-[10px] tracking-[0.2em] opacity-70 italic">Command chain & authority management</p>
        </div>
        <button 
          onClick={() => setIsOnboardModalOpen(true)}
          className="suraksha-button flex items-center gap-3 px-8 h-14"
        >
          <UserPlus className="w-5 h-5" />
          <span className="uppercase tracking-widest text-[11px] font-black">Onboard Specialist</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <div key={i} className="suraksha-card p-10 flex flex-col items-center justify-center text-center space-y-4 hover:border-blue-100 group transition-all">
             <div className={cn("w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform", stat.color.replace('text-', 'bg-').split('-')[0] + '-50', stat.color)}>
               <stat.icon className="w-8 h-8" />
             </div>
             <div>
               <div className={cn("text-4xl font-black tracking-tighter", stat.color)}>{stat.value}</div>
               <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{stat.label}</div>
             </div>
          </div>
        ))}
      </div>

      {/* Search & Filter Hub */}
      <div className="suraksha-card p-8 bg-white flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl shadow-blue-500/5">
         <div className="flex flex-wrap items-center gap-6 w-full lg:w-auto">
            <div className="relative w-full md:w-56 group text-center lg:text-left">
               <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-2 pointer-events-none">Authority Level</label>
               <div className="relative">
                 <select 
                   value={roleFilter}
                   onChange={(e) => setRoleFilter(e.target.value)}
                   className="appearance-none w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-[11px] font-black text-slate-600 uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all cursor-pointer"
                 >
                    <option>All Roles</option>
                    <option value="CITIZEN">Citizen</option>
                    <option value="VOLUNTEER">Volunteer</option>
                    <option value="DMC_OFFICER">DMC Officer</option>
                    <option value="ADMIN">Admin</option>
                 </select>
                 <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none group-focus-within:rotate-180 transition-transform" />
               </div>
            </div>
         </div>

         <div className="relative w-full lg:w-[500px] group">
            <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-2 pointer-events-none">Database Identity Search</label>
            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-[#0061ff] transition-colors" />
              <input 
                type="text" 
                placeholder="Search by identity name or secure email..." 
                className="suraksha-input pl-16 h-16 bg-slate-50 border-none font-bold placeholder:italic"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
         </div>
      </div>

      {/* Directory Table */}
      <div className="suraksha-card overflow-hidden bg-white border-none shadow-2xl shadow-blue-500/5">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="border-b border-slate-50/50">
              <tr className="bg-slate-50/30">
                <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Validated Identity</th>
                <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Communication Node</th>
                <th className="px-10 py-8 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Authority Clearance</th>
                <th className="px-10 py-8 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Enlistment Date</th>
                <th className="px-10 py-8 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Control Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-24">
                     <div className="flex flex-col items-center justify-center gap-4">
                        <div className="w-10 h-10 border-4 border-blue-100 border-t-[#0061ff] rounded-full animate-spin" />
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Decrypting Personnel Archives...</span>
                     </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-24">
                     <div className="flex flex-col items-center gap-4 opacity-30">
                        <UserCog className="w-16 h-16 text-slate-300" />
                        <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Zero Matching Profiles in Data Node</span>
                     </div>
                  </td>
                </tr>
              ) : filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-blue-50/[0.05] transition-all group">
                  <td className="px-10 py-8">
                    <div className="text-base font-black text-[#1e293b] group-hover:text-[#0061ff] transition-colors">{u.name}</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">ID-{u.id.slice(0, 8)}</div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="text-[13px] font-bold text-slate-500 lowercase tracking-tight">{u.email}</div>
                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">{u.phone || 'N/A'}</div>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <div className="relative inline-block group/role">
                      <select 
                         value={u.role}
                         onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                         className={cn(
                           "text-[9px] font-black px-5 py-2.5 rounded-2xl tracking-[0.2em] uppercase border transition-all cursor-pointer outline-none appearance-none pr-8",
                           u.role === 'VOLUNTEER' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                           u.role === 'DMC_OFFICER' ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                           u.role === 'ADMIN' ? "bg-rose-50 text-rose-600 border-rose-100" :
                           "bg-slate-50 text-slate-500 border-slate-100"
                         )}
                      >
                         <option value="CITIZEN">Citizen</option>
                         <option value="VOLUNTEER">Volunteer</option>
                         <option value="DMC_OFFICER">DMC Officer</option>
                         <option value="ADMIN">Admin</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300 pointer-events-none" />
                    </div>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <div className="text-[11px] font-black text-slate-400 uppercase tracking-tighter">{formatDistanceToNow(new Date(u.createdAt))} ago</div>
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mx-auto mt-2 animate-pulse" />
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center justify-center gap-4 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                      <button className="w-11 h-11 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-white hover:text-[#0061ff] hover:shadow-xl transition-all border border-transparent hover:border-slate-100" title="View Profile">
                        <Eye className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(u.id)}
                        className="w-11 h-11 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-400 hover:bg-rose-100 hover:text-rose-600 transition-all border border-transparent" title="Revoke Access"
                      >
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

      {/* Onboard Specialist Modal */}
      {isOnboardModalOpen && (
        <OnboardSpecialistModal 
          onClose={() => setIsOnboardModalOpen(false)} 
          onSuccess={() => { setIsOnboardModalOpen(false); fetchUsers(); }}
        />
      )}
    </div>
  )
}

function OnboardSpecialistModal({ onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'VOLUNTEER',
    phone: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { authService } = await import('../services/api')
      await authService.register(formData)
      onSuccess()
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Satellite Link Failure'
      const details = err.response?.data?.details || ''
      alert(`Onboarding Interrupted: ${msg}${details ? '\n\n' + details : ''}`)
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
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#1e293b]">Credentials Enlistment</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5 italic">Register Specialist Node #UX-00</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-300 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
           <div className="grid grid-cols-2 gap-6">
             <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 italic">Full Identity Name</label>
                <input 
                  required
                  className="suraksha-input" 
                  placeholder="e.g. Dr. Amal Perera"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 italic">Secure Comm Email</label>
                <input 
                  required
                  type="email"
                  className="suraksha-input" 
                  placeholder="name@suraksha.gov"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 italic">Default Access Key</label>
                <input 
                  required
                  type="password"
                  className="suraksha-input" 
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 italic">Clearance Level</label>
                <select 
                  className="suraksha-input uppercase tracking-tighter"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="VOLUNTEER">Field Volunteer</option>
                  <option value="DMC_OFFICER">DMC Officer</option>
                  <option value="ADMIN">System Admin</option>
                  <option value="CITIZEN">Standard Citizen</option>
                </select>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 italic">Direct Link Phone</label>
                <input 
                  required
                  className="suraksha-input" 
                  placeholder="+94 7X XXX XXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
             </div>
           </div>

           <button 
             type="submit" 
             disabled={loading}
             className="suraksha-button w-full h-14 uppercase tracking-widest text-[11px] font-black"
           >
             {loading ? 'Transmitting Credentials...' : 'Finalize Specialist Onboarding'}
           </button>
        </form>
      </div>
    </div>
  )
}
