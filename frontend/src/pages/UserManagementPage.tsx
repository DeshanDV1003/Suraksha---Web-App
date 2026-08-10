import { Search, UserPlus, Eye, Trash2, ChevronDown, UserCheck, X, Shield, ShieldAlert, User, UserCog, Upload, AlertCircle, Phone, Smartphone, Check, ShieldCheck, FileText, Activity, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { userService, authService } from '../services/api'
import { formatDistanceToNow, format } from 'date-fns'
import { useAppStore } from '@/store/useAppStore'
import Papa from 'papaparse'
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import { useTranslation } from 'react-i18next';

export default function UserManagementPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'DIRECTORY' | 'RBAC' | 'AUDIT' | 'SECURITY'>('DIRECTORY')
  const user = useAppStore(state => state.user)
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
      showToast(t('user_management_page.toast_role_updated'))
    } catch (err) {
      showToast(t('user_management_page.toast_role_failed'), 'error')
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm(t('user_management_page.confirm_delete'))) return
    try {
      await userService.deleteUser(id)
      fetchUsers()
      showToast(t('user_management_page.toast_deleted'))
    } catch (err) {
      showToast(t('user_management_page.toast_delete_failed'), 'error')
    }
  }

  const handleToggleAppStatus = async (id: string, currentStatus: boolean) => {
    try {
      await userService.toggleFieldResponderApp(id, !currentStatus)
      fetchUsers()
      showToast(t('user_management_page.toast_app_updated'))
    } catch (err) {
      showToast(t('user_management_page.toast_app_failed'), 'error')
    }
  }

  const handleSendAppLink = async (id: string) => {
    try {
      await userService.sendAppLink(id)
      showToast(t('user_management_page.toast_link_sent'))
    } catch (err) {
      showToast(t('user_management_page.toast_link_failed'), 'error')
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
    { label: t('user_management_page.total_base'), value: users.length.toString(), color: 'text-blue-600', icon: User },
    { label: t('user_management_page.dmc_personnel'), value: users.filter(u => u.role === 'DMC_OFFICER').length.toString(), color: 'text-indigo-600', icon: Shield },
    { label: t('user_management_page.field_responders'), value: users.filter(u => u.role === 'FIELD_RESPONDER' || u.role === 'VOLUNTEER').length.toString(), color: 'text-teal-600', icon: UserCheck },
    { label: t('user_management_page.administrators'), value: users.filter(u => u.role === 'ADMIN').length.toString(), color: 'text-rose-600', icon: ShieldAlert },
  ]

  return (
        <>
          <PageMeta title="User Management | Suraksha" description="Suraksha User Management Page" />
          <PageBreadcrumb pageTitle="User Management" />
          <div className="space-y-10 animate-in fade-in duration-700 font-sans pb-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            
            
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setIsBulkImportOpen(true)}
              className="suraksha-button flex items-center gap-3 px-6 h-14 bg-white/10 border border-white/20 text-white hover:bg-white/20"
            >
              <Upload className="w-5 h-5" />
              <span className="uppercase tracking-widest text-[11px] font-black">{t('user_management_page.bulk_import')}</span>
            </button>
            <button 
              onClick={() => setIsOnboardModalOpen(true)}
              className="suraksha-button flex items-center gap-3 px-8 h-14"
            >
              <UserPlus className="w-5 h-5" />
              <span className="uppercase tracking-widest text-[11px] font-black">{t('user_management_page.onboard_specialist')}</span>
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
                 <div className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mt-1">{stat.label}</div>
               </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'DIRECTORY', label: t('user_management_page.tabs.directory'), icon: User },
            ...(user?.role === 'ADMIN' ? [{ id: 'RBAC', label: t('user_management_page.tabs.rbac'), icon: ShieldCheck }] : []),
            { id: 'AUDIT', label: t('user_management_page.tabs.audit'), icon: FileText },
            { id: 'SECURITY', label: t('user_management_page.tabs.security'), icon: ShieldAlert }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-6 py-4 text-sm font-bold tracking-wide transition-all border-b-2",
                activeTab === tab.id 
                  ? "border-brand-500 text-brand-500" 
                  : "border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300 hover:border-slate-300"
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
              <div className="suraksha-card p-8 bg-white dark:bg-gray-900 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl shadow-blue-500/5">
                <div className="flex flex-wrap items-center gap-6 w-full lg:w-auto">
                    <div className="relative w-full md:w-56 group text-center lg:text-left">
                      <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-2 pointer-events-none">{t('user_management_page.authority_level')}</label>
                      <div className="relative">
                        <select 
                          value={roleFilter}
                          onChange={(e) => setRoleFilter(e.target.value)}
                          className="appearance-none w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-2xl px-6 py-4 text-[11px] font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all cursor-pointer"
                        >
                            <option>{t('user_management_page.all_roles')}</option>
                            <option value="CITIZEN">{t('user_management_page.citizen')}</option>
                            <option value="VOLUNTEER">{t('user_management_page.volunteer')}</option>
                            <option value="FIELD_RESPONDER">{t('user_management_page.field_responder')}</option>
                            <option value="DMC_OFFICER">{t('user_management_page.dmc_officer')}</option>
                            <option value="ADMIN">{t('user_management_page.admin')}</option>
                        </select>
                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none group-focus-within:rotate-180 transition-transform" />
                      </div>
                    </div>
                </div>

                <div className="relative w-full lg:w-[500px] group">
                    <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-2 pointer-events-none">{t('user_management_page.search_placeholder')}</label>
                    <div className="relative">
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-brand-500 transition-colors" />
                      <input 
                        type="text" 
                        placeholder={t('user_management_page.search_hint')} 
                        className="suraksha-input pl-16 h-16 bg-gray-50 dark:bg-gray-800/50 border-none font-bold placeholder:italic"
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                      />
                    </div>
                </div>
              </div>

              {/* Directory Table */}
              <div className="suraksha-card overflow-hidden bg-white dark:bg-gray-900 border-none shadow-2xl shadow-blue-500/5">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="border-b border-slate-50/50">
                      <tr className="bg-gray-50 dark:bg-gray-800/50/30">
                        <th className="px-6 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">{t('user_management_page.identity')}</th>
                        <th className="px-6 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">{t('user_management_page.comms_node')}</th>
                        <th className="px-6 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">{t('user_management_page.authority')}</th>
                        <th className="px-6 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">{t('user_management_page.field_app')}</th>
                        <th className="px-6 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">{t('user_management_page.actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50/50">
                      {loading ? (
                        <tr>
                          <td colSpan={5} className="py-24">
                            <div className="flex flex-col items-center justify-center gap-4">
                                <div className="w-10 h-10 border-4 border-blue-100 border-t-[#0061ff] rounded-full animate-spin" />
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">{t('user_management_page.loading')}</span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-24">
                            <div className="flex flex-col items-center gap-4 opacity-30">
                                <UserCog className="w-16 h-16 text-slate-300" />
                                <span className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">{t('user_management_page.no_profiles')}</span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-blue-50/[0.05] transition-all group">
                          <td className="px-6 py-6">
                            <div className="text-sm font-black text-gray-800 dark:text-white/90 group-hover:text-brand-500 transition-colors">{u.name}</div>
                            <div className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">ID-{u.id.slice(0, 8)}</div>
                          </td>
                          <td className="px-6 py-6">
                            <div className="text-[12px] font-bold text-gray-500 dark:text-gray-400 tracking-tight">{u.email}</div>
                            <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">{u.phone || t('user_management_page.no_phone_abbrev')}</div>
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
                                  "bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-800"
                                )}
                              >
                                <option value="CITIZEN">{t('user_management_page.citizen')}</option>
                                <option value="VOLUNTEER">{t('user_management_page.volunteer')}</option>
                                <option value="FIELD_RESPONDER">{t('user_management_page.field_responder')}</option>
                                <option value="DMC_OFFICER">{t('user_management_page.dmc_officer')}</option>
                                <option value="ADMIN">{t('user_management_page.admin')}</option>
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
                                  u.hasMobileApp ? "bg-green-100 text-green-700" : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:bg-gray-700"
                                )}
                              >
                                <Smartphone className="w-3 h-3" />
                                {u.hasMobileApp ? t('user_management_page.installed') : t('user_management_page.missing_app')}
                              </button>
                              {!u.hasMobileApp && (
                                <button 
                                  onClick={() => handleSendAppLink(u.id)}
                                  className="text-[9px] text-brand-500 font-bold underline"
                                >
                                  {t('user_management_page.send_link')}
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
            onSuccess={() => { setIsBulkImportOpen(false); fetchUsers(); showToast(t('user_management_page.toast_imported')); }}
            showToast={showToast}
          />
        )}

        {toast && (
          <div className={cn(
            "fixed bottom-8 right-8 z-[999999] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-8 duration-300 font-sans",
            toast.type === 'success' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"
          )}>
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-bold text-sm tracking-wide">{toast.message}</span>
          </div>
        )}
      </div>
        </>
      )
}

function RBACMatrixTab({ showToast }: any) {
  const { t } = useTranslation()
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
      showToast(t('user_management_page.rbac_updated'))
      fetchMatrix()
    } catch (err) {
      showToast(t('user_management_page.rbac_failed'), 'error')
    }
  }

  return (
    <div className="suraksha-card p-10 bg-white dark:bg-gray-900 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-gray-800 dark:text-white/90">{t('user_management_page.rbac_title')}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('user_management_page.rbac_desc')}</p>
        </div>
        <button onClick={saveMatrix} className="suraksha-button px-8">{t('user_management_page.save_policy')}</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50">
              <th className="px-6 py-4 text-left text-xs font-black uppercase text-gray-500 dark:text-gray-400">{t('user_management_page.role_module')}</th>
              {defaultModules.map(mod => (
                <th key={mod} className="px-6 py-4 text-center text-xs font-black uppercase text-gray-500 dark:text-gray-400">{mod}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {roles.map(role => (
              <tr key={role} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-6 font-black text-sm text-gray-800 dark:text-white/90">{role}</td>
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
                          <span className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase">{t('user_management_page.view')}</span>
                        </label>
                        <label className="flex flex-col items-center gap-1 cursor-pointer group">
                          <input type="checkbox" className="peer sr-only" checked={p.canEdit} onChange={() => togglePerm(pIdx, 'canEdit')} />
                          <div className="w-5 h-5 rounded border border-slate-300 peer-checked:bg-orange-500 peer-checked:border-orange-500 flex items-center justify-center transition-colors">
                            {p.canEdit && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase">{t('user_management_page.edit')}</span>
                        </label>
                        <label className="flex flex-col items-center gap-1 cursor-pointer group">
                          <input type="checkbox" className="peer sr-only" checked={p.canDelete} onChange={() => togglePerm(pIdx, 'canDelete')} />
                          <div className="w-5 h-5 rounded border border-slate-300 peer-checked:bg-red-500 peer-checked:border-red-500 flex items-center justify-center transition-colors">
                            {p.canDelete && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase">{t('user_management_page.del')}</span>
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
  const { t } = useTranslation()
  const [logs, setLogs] = useState<{sessions: any[], actions: any[]}>({ sessions: [], actions: [] })
  
  useEffect(() => {
    userService.getAuditLogs().then(res => setLogs(res.data)).catch(console.error)
  }, [])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
      <div className="suraksha-card p-8 bg-white dark:bg-gray-900">
        <h3 className="text-lg font-black text-gray-800 dark:text-white/90 mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          {t('user_management_page.recent_logins')}
        </h3>
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {logs.sessions.map((s, i) => (
            <div key={i} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 flex flex-col gap-2 border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-gray-800 dark:text-white/90">{s.user?.email}</span>
                <span className="text-[10px] font-black text-gray-400 dark:text-gray-500">{format(new Date(s.loginTime), 'PP p')}</span>
              </div>
              <div className="flex gap-4 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <span>{t('user_management_page.ip')} {s.ipAddress || 'UNKNOWN'}</span>
                <span>{t('user_management_page.device')} {s.device ? s.device.slice(0,20) + '...' : 'UNKNOWN'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="suraksha-card p-8 bg-white dark:bg-gray-900">
        <h3 className="text-lg font-black text-gray-800 dark:text-white/90 mb-6 flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-500" />
          {t('user_management_page.system_audit')}
        </h3>
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {logs.actions.map((a, i) => (
            <div key={i} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 flex flex-col gap-2 border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center">
                <span className={cn(
                  "px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest",
                  a.action === 'UPDATE' ? 'bg-orange-100 text-orange-700' :
                  a.action === 'DELETE' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                )}>{a.action}</span>
                <span className="text-[10px] font-black text-gray-400 dark:text-gray-500">{format(new Date(a.createdAt), 'PP p')}</span>
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {t('user_management_page.user_action_prefix')} <span className="font-bold text-slate-800">{a.userId}</span> {t('user_management_page.user_action_desc')} <span className="font-bold text-slate-800">{a.entity} ({a.entityId})</span>.
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SecurityTab({ showToast }: any) {
  const { t } = useTranslation()
  const [setupData, setSetupData] = useState<any>(null)
  const [token, setToken] = useState('')
  const [verifying, setVerifying] = useState(false)

  const initiateSetup = async () => {
    try {
      const res = await authService.setup2FA()
      setSetupData(res.data)
    } catch(e) {
      showToast(t('user_management_page.two_fa_init_failed'), 'error')
    }
  }

  const verifySetup = async () => {
    setVerifying(true)
    try {
      await authService.verify2FA(token)
      showToast(t('user_management_page.two_fa_enabled'))
      setSetupData(null)
    } catch(e) {
      showToast(t('user_management_page.invalid_token'), 'error')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="suraksha-card p-10 bg-white dark:bg-gray-900 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-800 dark:text-white/90">{t('user_management_page.two_fa_title')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t('user_management_page.two_fa_desc')}</p>
        </div>
      </div>

      <div className="max-w-md">
        <h3 className="font-bold mb-4">{t('user_management_page.setup_authenticator')}</h3>
        {!setupData ? (
          <button onClick={initiateSetup} className="suraksha-button">{t('user_management_page.enable_2fa')}</button>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex justify-center">
              <img src={setupData.qrCode} alt="QR Code" className="w-48 h-48 rounded-xl bg-white dark:bg-gray-900 p-2" />
            </div>
            <div className="space-y-2 text-center">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400">{t('user_management_page.enter_secret')}</p>
              <code className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-slate-800 rounded font-mono text-sm tracking-widest block">{setupData.secret}</code>
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
                {t('user_management_page.verify')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function BulkImportModal({ onClose, onSuccess, showToast }: any) {
  const { t } = useTranslation()
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
      showToast(t('user_management_page.toast_role_failed'), 'error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="suraksha-card w-full max-w-4xl bg-white dark:bg-gray-900 p-10 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-8 shrink-0">
          <div>
            <h2 className="text-2xl font-black">{t('user_management_page.bulk_title')}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-1">{t('user_management_page.csv_import')}</p>
          </div>
          <button onClick={onClose}><X className="w-6 h-6 text-gray-400 dark:text-gray-500" /></button>
        </div>

        {!csvData.length ? (
          <div className="flex-1 flex flex-col items-center justify-center p-20 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl bg-gray-50 dark:bg-gray-800/50/50">
            <Upload className="w-12 h-12 text-slate-300 mb-4" />
            <p className="font-bold text-gray-600 dark:text-gray-300 mb-6">{t('user_management_page.upload_csv')}</p>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="text-sm file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-xs file:font-black file:uppercase file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors" />
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-auto border border-gray-200 dark:border-gray-800 rounded-xl mb-6">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/50 sticky top-0">
                  <tr>
                    <th className="p-4 text-left font-black uppercase text-[10px] tracking-widest text-gray-500 dark:text-gray-400">Name</th>
                    <th className="p-4 text-left font-black uppercase text-[10px] tracking-widest text-gray-500 dark:text-gray-400">Email</th>
                    <th className="p-4 text-left font-black uppercase text-[10px] tracking-widest text-gray-500 dark:text-gray-400">NIC</th>
                    <th className="p-4 text-left font-black uppercase text-[10px] tracking-widest text-gray-500 dark:text-gray-400">Phone</th>
                    <th className="p-4 text-left font-black uppercase text-[10px] tracking-widest text-gray-500 dark:text-gray-400">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {csvData.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:bg-gray-800/50">
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
              <button onClick={() => setCsvData([])} className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-800 rounded-xl">{t('user_management_page.discard')}</button>
              <button onClick={submitImport} disabled={uploading} className="suraksha-button px-8">
                {uploading ? t('user_management_page.processing') : t('user_management_page.commit_import')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function OnboardSpecialistModal({ onClose, onSuccess, showToast }: any) {
  const { t } = useTranslation()
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
      showToast(`${t('user_management_page.onboarding_failed')} ${msg}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="suraksha-card w-full max-w-xl bg-white dark:bg-gray-900 p-10 space-y-8 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-50 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-brand-500">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-800 dark:text-white/90">{t('user_management_page.credentials_enlistment')}</h2>
              <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">{t('user_management_page.register_specialist')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-gray-50 dark:bg-gray-800/50 rounded-xl transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
           <div className="grid grid-cols-2 gap-6">
             <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('user_management_page.full_identity')}</label>
                <input required className="suraksha-input" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('user_management_page.email')}</label>
                <input required type="email" className="suraksha-input" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('user_management_page.password')}</label>
                <input required type="password" className="suraksha-input" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('user_management_page.role')}</label>
                <select className="suraksha-input" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                  <option value="VOLUNTEER">{t('user_management_page.field_volunteer')}</option>
                  <option value="FIELD_RESPONDER">{t('user_management_page.field_responder')}</option>
                  <option value="DMC_OFFICER">{t('user_management_page.dmc_officer')}</option>
                  <option value="ADMIN">{t('user_management_page.system_admin')}</option>
                  <option value="CITIZEN">{t('user_management_page.standard_citizen')}</option>
                </select>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('user_management_page.phone')}</label>
                <input required className="suraksha-input" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
             </div>
           </div>
           <button type="submit" disabled={loading} className="suraksha-button w-full h-14">
             {loading ? t('user_management_page.transmitting') : t('user_management_page.finalize_onboarding')}
           </button>
        </form>
      </div>
    </div>
  )
}
