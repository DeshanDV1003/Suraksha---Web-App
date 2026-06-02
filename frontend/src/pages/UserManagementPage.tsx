import { Search, UserPlus, Eye, Trash2, ChevronDown, UserCheck, X, Shield, ShieldAlert, User, UserCog, Upload, AlertCircle, Phone, Smartphone, Check, ShieldCheck, FileText, Activity, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { userService, authService } from '../services/api'
import { formatDistanceToNow, format } from 'date-fns'
import { useAppStore } from '@/store/useAppStore'
import Papa from 'papaparse'

export default function UserManagementPage() {
  const [activeTab, setActiveTab] = useState<'DIRECTORY' | 'RBAC' | 'AUDIT' | 'SECURITY'>('DIRECTORY')
  const [localSearch, setLocalSearch] = useState('')
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState('All Roles')
  
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false)
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false)

  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

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
      showToast('Role updated successfully')
    } catch (err) {
      showToast('Failed to update role', 'error')
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user? This action is irreversible.')) return
    try {
      await userService.deleteUser(id)
      fetchUsers()
      showToast('User deleted successfully')
    } catch (err) {
      showToast('Failed to delete user', 'error')
    }
  }

  const handleToggleAppStatus = async (id: string, currentStatus: boolean) => {
    try {
      await userService.toggleFieldResponderApp(id, !currentStatus)
      fetchUsers()
      showToast('App status updated successfully')
    } catch (err) {
      showToast('Failed to update app status', 'error')
    }
  }

  const handleSendAppLink = async (id: string) => {
    try {
      await userService.sendAppLink(id)
      showToast('App link sent via SMS successfully.')
    } catch (err) {
      showToast('Failed to send app link. Ensure user has a valid phone number.', 'error')
    }
  }

  const filteredUsers = users.filter(u => {
    const searchStr = localSearch.toLowerCase().trim()
    const matchesSearch = !searchStr || 
                          (u.name && u.name.toLowerCase().includes(searchStr)) || 
                          (u.email && u.email.toLowerCase().includes(searchStr)) ||
                          (u.id && u.id.toLowerCase().includes(searchStr))
    const matchesRole = roleFilter === 'All Roles' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  const stats = [
    { label: 'Total Base', value: users.length.toString(), color: 'text-blue-600', icon: User },
    { label: 'DMC Personnel', value: users.filter(u => u.role === 'DMC_OFFICER').length.toString(), color: 'text-indigo-600', icon: Shield },
    { label: 'Field Responders', value: users.filter(u => u.role === 'FIELD_RESPONDER' || u.role === 'VOLUNTEER').length.toString(), color: 'text-teal-600', icon: UserCheck },
    { label: 'Administrators', value: users.filter(u => u.role === 'ADMIN').length.toString(), color: 'text-rose-600', icon: ShieldAlert },
  ]

  return (
    <div className="space-y-10 animate-in fade-in duration-700 font-sans pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1e293b]">Personnel Directory</h1>
          <p className="text-slate-500 mt-1 font-medium">Command chain & authority management</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsBulkImportOpen(true)}
            className="suraksha-button flex items-center gap-3 px-6 h-14 bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            <Upload className="w-5 h-5" />
            <span className="uppercase tracking-widest text-[11px] font-black">Bulk Import (CSV)</span>
          </button>
          <button 
            onClick={() => setIsOnboardModalOpen(true)}
            className="suraksha-button flex items-center gap-3 px-8 h-14"
          >
            <UserPlus className="w-5 h-5" />
            <span className="uppercase tracking-widest text-[11px] font-black">Onboard Specialist</span>
          </button>
        </div>
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

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200">
        {[
          { id: 'DIRECTORY', label: 'Directory', icon: User },
          { id: 'RBAC', label: 'RBAC Matrix', icon: ShieldCheck },
          { id: 'AUDIT', label: 'Audit Logs', icon: FileText },
          { id: 'SECURITY', label: '2FA & Security', icon: ShieldAlert }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-4 text-sm font-bold tracking-wide transition-all border-b-2",
              activeTab === tab.id 
                ? "border-[#0061ff] text-[#0061ff]" 
                : "border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {activeTab === 'DIRECTORY' && (
          <div className="space-y-8">
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
                          <option value="FIELD_RESPONDER">Field Responder</option>
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
                      value={localSearch}
                      onChange={(e) => setLocalSearch(e.target.value)}
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
                      <th className="px-6 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Identity</th>
                      <th className="px-6 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Comms Node</th>
                      <th className="px-6 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Authority</th>
                      <th className="px-6 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Field App</th>
                      <th className="px-6 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Actions</th>
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
                              <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Zero Matching Profiles</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-blue-50/[0.05] transition-all group">
                        <td className="px-6 py-6">
                          <div className="text-sm font-black text-[#1e293b] group-hover:text-[#0061ff] transition-colors">{u.name}</div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">ID-{u.id.slice(0, 8)}</div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="text-[12px] font-bold text-slate-500 tracking-tight">{u.email}</div>
                          <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">{u.phone || 'NO PHONE'}</div>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <div className="relative inline-block group/role">
                            <select 
                              value={u.role}
                              onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                              className={cn(
                                "text-[9px] font-black px-4 py-2 rounded-2xl tracking-[0.2em] uppercase border transition-all cursor-pointer outline-none appearance-none pr-8",
                                u.role === 'VOLUNTEER' || u.role === 'FIELD_RESPONDER' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                                u.role === 'DMC_OFFICER' ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                                u.role === 'ADMIN' ? "bg-rose-50 text-rose-600 border-rose-100" :
                                "bg-slate-50 text-slate-500 border-slate-100"
                              )}
                            >
                              <option value="CITIZEN">Citizen</option>
                              <option value="VOLUNTEER">Volunteer</option>
                              <option value="FIELD_RESPONDER">Field Responder</option>
                              <option value="DMC_OFFICER">DMC Officer</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300 pointer-events-none" />
                          </div>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <button 
                              onClick={() => handleToggleAppStatus(u.id, u.hasMobileApp)}
                              className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-colors",
                                u.hasMobileApp ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                              )}
                            >
                              <Smartphone className="w-3 h-3" />
                              {u.hasMobileApp ? 'Installed' : 'Missing'}
                            </button>
                            {!u.hasMobileApp && (
                              <button 
                                onClick={() => handleSendAppLink(u.id)}
                                className="text-[9px] text-[#0061ff] font-bold underline"
                              >
                                Send Link
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex items-center justify-center gap-3">
                            <button 
                              onClick={() => handleDeleteUser(u.id)}
                              className="w-10 h-10 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-400 hover:bg-rose-100 hover:text-rose-600 transition-all border border-transparent" title="Revoke Access"
                            >
                              <Trash2 className="w-4 h-4" />
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
        )}

        {activeTab === 'RBAC' && <RBACMatrixTab showToast={showToast} />}
        {activeTab === 'AUDIT' && <AuditLogsTab />}
        {activeTab === 'SECURITY' && <SecurityTab showToast={showToast} />}
      </div>

      {isOnboardModalOpen && (
        <OnboardSpecialistModal 
          onClose={() => setIsOnboardModalOpen(false)} 
          onSuccess={() => { setIsOnboardModalOpen(false); fetchUsers(); }}
          showToast={showToast}
        />
      )}

      {isBulkImportOpen && (
        <BulkImportModal 
          onClose={() => setIsBulkImportOpen(false)}
          onSuccess={() => { setIsBulkImportOpen(false); fetchUsers(); showToast('Users imported successfully'); }}
          showToast={showToast}
        />
      )}

      {toast && (
        <div className={cn(
          "fixed bottom-8 right-8 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-8 duration-300 font-sans",
          toast.type === 'success' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"
        )}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-bold text-sm tracking-wide">{toast.message}</span>
        </div>
      )}
    </div>
  )
}

function RBACMatrixTab({ showToast }: any) {
  const [matrix, setMatrix] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const defaultModules = ['Incidents', 'Alerts', 'Users', 'Resources', 'Analytics']
  const roles = ['CITIZEN', 'VOLUNTEER', 'FIELD_RESPONDER', 'DMC_OFFICER', 'ADMIN']

  useEffect(() => {
    fetchMatrix()
  }, [])

  const fetchMatrix = async () => {
    try {
      const res = await userService.getRBACMatrix()
      let perms = res.data
      
      // Seed missing permutations
      const updated = [...perms]
      roles.forEach(role => {
        defaultModules.forEach(mod => {
          if (!updated.find(p => p.role === role && p.module === mod)) {
            updated.push({ role, module: mod, canView: false, canEdit: false, canDelete: false })
          }
        })
      })
      setMatrix(updated)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const togglePerm = (idx: number, field: 'canView' | 'canEdit' | 'canDelete') => {
    const next = [...matrix]
    next[idx][field] = !next[idx][field]
    setMatrix(next)
  }

  const saveMatrix = async () => {
    try {
      await userService.updateRBACMatrix(matrix)
      showToast('RBAC Matrix updated successfully')
      fetchMatrix()
    } catch (err) {
      showToast('Failed to save matrix', 'error')
    }
  }

  return (
    <div className="suraksha-card p-10 bg-white space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-[#1e293b]">Role-Based Access Control (RBAC)</h2>
          <p className="text-xs text-slate-500 font-medium">Define granular permissions across all operational modules.</p>
        </div>
        <button onClick={saveMatrix} className="suraksha-button px-8">Save Policy Matrix</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-6 py-4 text-left text-xs font-black uppercase text-slate-500">Role / Module</th>
              {defaultModules.map(mod => (
                <th key={mod} className="px-6 py-4 text-center text-xs font-black uppercase text-slate-500">{mod}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {roles.map(role => (
              <tr key={role} className="hover:bg-slate-50/50">
                <td className="px-6 py-6 font-black text-sm text-[#1e293b]">{role}</td>
                {defaultModules.map(mod => {
                  const pIdx = matrix.findIndex(m => m.role === role && m.module === mod)
                  const p = matrix[pIdx]
                  if (!p) return <td key={mod} />
                  return (
                    <td key={mod} className="px-6 py-6">
                      <div className="flex justify-center gap-4">
                        <label className="flex flex-col items-center gap-1 cursor-pointer group">
                          <input type="checkbox" className="peer sr-only" checked={p.canView} onChange={() => togglePerm(pIdx, 'canView')} />
                          <div className="w-5 h-5 rounded border border-slate-300 peer-checked:bg-blue-500 peer-checked:border-blue-500 flex items-center justify-center transition-colors">
                            {p.canView && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className="text-[8px] font-black text-slate-400 uppercase">View</span>
                        </label>
                        <label className="flex flex-col items-center gap-1 cursor-pointer group">
                          <input type="checkbox" className="peer sr-only" checked={p.canEdit} onChange={() => togglePerm(pIdx, 'canEdit')} />
                          <div className="w-5 h-5 rounded border border-slate-300 peer-checked:bg-orange-500 peer-checked:border-orange-500 flex items-center justify-center transition-colors">
                            {p.canEdit && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className="text-[8px] font-black text-slate-400 uppercase">Edit</span>
                        </label>
                        <label className="flex flex-col items-center gap-1 cursor-pointer group">
                          <input type="checkbox" className="peer sr-only" checked={p.canDelete} onChange={() => togglePerm(pIdx, 'canDelete')} />
                          <div className="w-5 h-5 rounded border border-slate-300 peer-checked:bg-red-500 peer-checked:border-red-500 flex items-center justify-center transition-colors">
                            {p.canDelete && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className="text-[8px] font-black text-slate-400 uppercase">Del</span>
                        </label>
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AuditLogsTab() {
  const [logs, setLogs] = useState<{sessions: any[], actions: any[]}>({ sessions: [], actions: [] })
  
  useEffect(() => {
    userService.getAuditLogs().then(res => setLogs(res.data)).catch(console.error)
  }, [])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
      <div className="suraksha-card p-8 bg-white">
        <h3 className="text-lg font-black text-[#1e293b] mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          Recent Session Logins
        </h3>
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {logs.sessions.map((s, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-50 flex flex-col gap-2 border border-slate-100">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-[#1e293b]">{s.user?.email}</span>
                <span className="text-[10px] font-black text-slate-400">{format(new Date(s.loginTime), 'PP p')}</span>
              </div>
              <div className="flex gap-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                <span>IP: {s.ipAddress || 'UNKNOWN'}</span>
                <span>Device: {s.device ? s.device.slice(0,20) + '...' : 'UNKNOWN'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="suraksha-card p-8 bg-white">
        <h3 className="text-lg font-black text-[#1e293b] mb-6 flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-500" />
          System Activity Audit
        </h3>
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {logs.actions.map((a, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-50 flex flex-col gap-2 border border-slate-100">
              <div className="flex justify-between items-center">
                <span className={cn(
                  "px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest",
                  a.action === 'UPDATE' ? 'bg-orange-100 text-orange-700' :
                  a.action === 'DELETE' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                )}>{a.action}</span>
                <span className="text-[10px] font-black text-slate-400">{format(new Date(a.createdAt), 'PP p')}</span>
              </div>
              <p className="text-sm font-medium text-slate-600">
                User <span className="font-bold text-slate-800">{a.userId}</span> performed action on <span className="font-bold text-slate-800">{a.entity} ({a.entityId})</span>.
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SecurityTab({ showToast }: any) {
  const [setupData, setSetupData] = useState<any>(null)
  const [token, setToken] = useState('')
  const [verifying, setVerifying] = useState(false)

  const initiateSetup = async () => {
    try {
      const res = await authService.setup2FA()
      setSetupData(res.data)
    } catch(e) {
      showToast('Failed to initiate 2FA setup', 'error')
    }
  }

  const verifySetup = async () => {
    setVerifying(true)
    try {
      await authService.verify2FA(token)
      showToast('2FA Enabled Successfully')
      setSetupData(null)
      // refresh user state if needed
    } catch(e) {
      showToast('Invalid Token', 'error')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="suraksha-card p-10 bg-white space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-[#1e293b]">2FA Security Enforcement</h2>
          <p className="text-sm text-slate-500 font-medium">Protect personnel accounts with mandatory Two-Factor Authentication.</p>
        </div>
      </div>

      <div className="max-w-md">
        <h3 className="font-bold mb-4">Setup Authenticator App</h3>
        {!setupData ? (
          <button onClick={initiateSetup} className="suraksha-button">Enable 2FA (TOTP)</button>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 rounded-xl flex justify-center">
              <img src={setupData.qrCode} alt="QR Code" className="w-48 h-48 rounded-xl bg-white p-2" />
            </div>
            <div className="space-y-2 text-center">
              <p className="text-xs font-bold text-slate-500">Or enter secret manually:</p>
              <code className="px-4 py-2 bg-slate-100 text-slate-800 rounded font-mono text-sm tracking-widest block">{setupData.secret}</code>
            </div>
            <div className="flex gap-4">
              <input 
                type="text" 
                maxLength={6} 
                placeholder="000000" 
                className="suraksha-input text-center tracking-[0.5em] text-lg font-black"
                value={token}
                onChange={e => setToken(e.target.value)}
              />
              <button onClick={verifySetup} disabled={verifying || token.length !== 6} className="suraksha-button whitespace-nowrap">
                Verify
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function BulkImportModal({ onClose, onSuccess, showToast }: any) {
  const [csvData, setCsvData] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = (e: any) => {
    const file = e.target.files[0]
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setCsvData(results.data)
        }
      })
    }
  }

  const submitImport = async () => {
    setUploading(true)
    try {
      const payload = csvData.map(row => ({
        name: row.Name || row.name,
        email: row.Email || row.email,
        nic: row.NIC || row.nic,
        phone: row.Phone || row.phone,
        role: row.Role || row.role || 'CITIZEN'
      }))
      await userService.bulkImport(payload)
      onSuccess()
    } catch(e) {
      showToast('Failed to import', 'error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="suraksha-card w-full max-w-4xl bg-white p-10 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-8 shrink-0">
          <div>
            <h2 className="text-2xl font-black">Bulk Personnel Onboarding</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">CSV Identity Matrix Import</p>
          </div>
          <button onClick={onClose}><X className="w-6 h-6 text-slate-400" /></button>
        </div>

        {!csvData.length ? (
          <div className="flex-1 flex flex-col items-center justify-center p-20 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
            <Upload className="w-12 h-12 text-slate-300 mb-4" />
            <p className="font-bold text-slate-600 mb-6">Upload CSV file (Name, Email, NIC, Phone, Role)</p>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="text-sm file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-xs file:font-black file:uppercase file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors" />
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-auto border border-slate-100 rounded-xl mb-6">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="p-4 text-left font-black uppercase text-[10px] tracking-widest text-slate-500">Name</th>
                    <th className="p-4 text-left font-black uppercase text-[10px] tracking-widest text-slate-500">Email</th>
                    <th className="p-4 text-left font-black uppercase text-[10px] tracking-widest text-slate-500">NIC</th>
                    <th className="p-4 text-left font-black uppercase text-[10px] tracking-widest text-slate-500">Phone</th>
                    <th className="p-4 text-left font-black uppercase text-[10px] tracking-widest text-slate-500">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {csvData.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-4 font-bold">{row.Name || row.name}</td>
                      <td className="p-4">{row.Email || row.email}</td>
                      <td className="p-4">{row.NIC || row.nic}</td>
                      <td className="p-4">{row.Phone || row.phone}</td>
                      <td className="p-4 font-black">{row.Role || row.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-4 shrink-0">
              <button onClick={() => setCsvData([])} className="px-6 py-3 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl">Discard</button>
              <button onClick={submitImport} disabled={uploading} className="suraksha-button px-8">
                {uploading ? 'Processing...' : 'Commit Import'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function OnboardSpecialistModal({ onClose, onSuccess, showToast }: any) {
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
      await authService.register(formData)
      onSuccess()
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failure'
      showToast(`Onboarding Interrupted: ${msg}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="suraksha-card w-full max-w-xl bg-white p-10 space-y-8 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-50 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#0061ff]">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#1e293b]">Credentials Enlistment</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Register Specialist Node</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-slate-50 rounded-xl transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
           <div className="grid grid-cols-2 gap-6">
             <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Identity Name</label>
                <input required className="suraksha-input" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</label>
                <input required type="email" className="suraksha-input" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                <input required type="password" className="suraksha-input" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</label>
                <select className="suraksha-input" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                  <option value="VOLUNTEER">Field Volunteer</option>
                  <option value="FIELD_RESPONDER">Field Responder</option>
                  <option value="DMC_OFFICER">DMC Officer</option>
                  <option value="ADMIN">System Admin</option>
                  <option value="CITIZEN">Standard Citizen</option>
                </select>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</label>
                <input required className="suraksha-input" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
             </div>
           </div>
           <button type="submit" disabled={loading} className="suraksha-button w-full h-14">
             {loading ? 'Transmitting...' : 'Finalize Onboarding'}
           </button>
        </form>
      </div>
    </div>
  )
}
