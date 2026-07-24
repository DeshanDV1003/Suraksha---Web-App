import { useState, useEffect, useRef } from 'react'
import {
  User, Bell, Shield, Palette,
  Globe, Lock, Mail,
  Phone, Briefcase, Camera, Save, Loader2, Moon, Sun,
  Monitor, Key, HardDrive, Download, Trash2, AlertTriangle,
  Smartphone, Map, List, Clock, Check, Eye, EyeOff, X
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useDialog } from '@/components/ui/dialogs/DialogProvider'
import { cn } from '@/lib/utils'
import { userService, authService } from '@/services/api'
import { useTranslation } from 'react-i18next'
import PageBreadcrumb from "@/components/common/PageBreadCrumb"
import PageMeta from "@/components/common/PageMeta"

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div className={cn(
      "fixed bottom-8 right-8 z-[100] animate-in fade-in slide-in-from-bottom-4 flex items-center gap-3 px-6 py-4 rounded-2xl border font-bold text-sm shadow-2xl backdrop-blur-md",
      type === 'success'
        ? "bg-white dark:bg-[#131f33] text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
        : "bg-white dark:bg-[#131f33] text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30"
    )}>
      {type === 'success' ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
      {message}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function DarkInput({ label, value, type = 'text', icon: Icon, placeholder, onChange, disabled }: any) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  return (
    <div className="space-y-1.5">
      {label && <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">{label}</label>}
      <div className={cn("relative group", disabled && "opacity-60")}>
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors">
          <Icon className="w-4 h-4" />
        </div>
        <input
          type={isPassword ? (show ? 'text' : 'password') : type}
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full h-12 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl pl-11 pr-11 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all disabled:cursor-not-allowed"
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(s => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-white">
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  )
}

function DarkSelect({ label, value, options, icon: Icon, onChange, disabled, useObj = false }: any) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">{label}</label>}
      <div className={cn("relative group", disabled && "opacity-60")}>
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
          <Icon className="w-4 h-4" />
        </div>
        <select
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          className="w-full h-12 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl pl-11 pr-10 text-sm font-bold text-gray-900 dark:text-white appearance-none cursor-pointer focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
        >
          {options.map((opt: any) => (
            <option key={useObj ? opt.v : opt} value={useObj ? opt.v : opt} className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
              {useObj ? opt.l : opt}
            </option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m6 9 6 6 6-6" /></svg>
        </div>
      </div>
    </div>
  )
}

function DarkToggle({ title, desc, checked = false, onChange }: any) {
  return (
    <div className="flex items-center justify-between p-5 rounded-2xl bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 transition-all">
      <div className="space-y-0.5">
        <div className="text-sm font-bold text-gray-900 dark:text-white">{title}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{desc}</div>
      </div>
      <button
        onClick={() => onChange?.(!checked)}
        className={cn("w-11 h-6 rounded-full transition-all duration-300 p-1 flex items-center focus:outline-none flex-shrink-0", checked ? "bg-blue-500" : "bg-slate-700")}
      >
        <div className={cn("w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300", checked ? "translate-x-5" : "translate-x-0")} />
      </button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { confirm } = useDialog()
  const { t, i18n } = useTranslation()
  const { user, updateUser } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── App Preferences (localStorage) ──────────────────────────────────────────
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')
  const [mapView, setMapView] = useState(localStorage.getItem('mapView') || 'hybrid')
  const [incidentSort, setIncidentSort] = useState(localStorage.getItem('incidentSort') || 'severity')
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('suraksha_prefs') || '{}') } catch { return {} }
  })
  const [minSeverityPush, setMinSeverityPush] = useState(parseInt(localStorage.getItem('minSeverityPush') || '4'))

  const updatePref = (key: string, val: boolean) => {
    setPrefs(p => { const n = { ...p, [key]: val }; localStorage.setItem('suraksha_prefs', JSON.stringify(n)); return n })
  }
  const getPref = (key: string, def = false) => prefs[key] ?? def

  useEffect(() => {
    const root = window.document.documentElement
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark')
    } else { root.classList.remove('dark') }
    localStorage.setItem('theme', theme)
  }, [theme])
  useEffect(() => { localStorage.setItem('mapView', mapView) }, [mapView])
  useEffect(() => { localStorage.setItem('incidentSort', incidentSort) }, [incidentSort])
  useEffect(() => { localStorage.setItem('minSeverityPush', minSeverityPush.toString()) }, [minSeverityPush])

  // ── Profile ──────────────────────────────────────────────────────────────────
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    email: '',
    designation: '',
    profilePicture: null as string | null,
  })
  const [profileLoading, setProfileLoading] = useState(true)
  const [savedProfile, setSavedProfile] = useState(profileData)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    userService.getMe().then((res: any) => {
      const u = res.data
      const p = {
        name: u.name || '',
        phone: u.phone || '',
        email: u.email || '',
        designation: u.role?.replace(/_/g, ' ') || '',
        profilePicture: u.profilePicture || null,
      }
      setProfileData(p)
      setSavedProfile(p)
    }).catch(() => {
      // fall back to auth context
      const p = {
        name: user?.name || '',
        phone: user?.phone || '',
        email: user?.email || '',
        designation: user?.role?.replace(/_/g, ' ') || '',
        profilePicture: (user as any)?.profilePicture || null,
      }
      setProfileData(p)
      setSavedProfile(p)
    }).finally(() => setProfileLoading(false))
  }, [])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { showToast('Image must be under 5 MB', 'error'); return }
    const reader = new FileReader()
    reader.onloadend = () => {
      // Resize to max 256×256 so the base64 stays small enough for the DB
      const img = new Image()
      img.onload = () => {
        const MAX = 256
        const scale = Math.min(1, MAX / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        const resized = canvas.toDataURL('image/jpeg', 0.82)
        setProfileData(prev => ({ ...prev, profilePicture: resized }))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profileData.name.trim()) { showToast('Name cannot be empty', 'error'); return }
    setIsSubmitting(true)
    try {
      const res = await userService.updateProfile({
        name: profileData.name,
        phone: profileData.phone,
        profilePicture: profileData.profilePicture,
      })
      const updated = res.data
      updateUser({ name: updated.name, phone: updated.phone, profilePicture: updated.profilePicture })
      setSavedProfile(profileData)
      showToast('Profile saved successfully')
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Unknown error'
      console.error('Profile save failed:', err?.response?.status, msg)
      showToast(`Save failed: ${msg}`, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Change Password Modal ────────────────────────────────────────────────────
  const [showPwModal, setShowPwModal] = useState(false)
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwSubmitting, setPwSubmitting] = useState(false)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pwForm.next.length < 8) { showToast('New password must be at least 8 characters', 'error'); return }
    if (pwForm.next !== pwForm.confirm) { showToast('Passwords do not match', 'error'); return }
    setPwSubmitting(true)
    try {
      await authService.changePassword({ currentPassword: pwForm.current, newPassword: pwForm.next })
      showToast('Password changed successfully')
      setShowPwModal(false)
      setPwForm({ current: '', next: '', confirm: '' })
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to change password', 'error')
    } finally {
      setPwSubmitting(false)
    }
  }

  // ── Sessions ─────────────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState<any[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)

  useEffect(() => {
    if (activeTab !== 'security') return
    setSessionsLoading(true)
    userService.getSessions().then((res: any) => setSessions(res.data)).catch(() => setSessions([])).finally(() => setSessionsLoading(false))
  }, [activeTab])

  const handleRevokeSession = async (id: string) => {
    try {
      await userService.deleteSession(id)
      setSessions(prev => prev.filter(s => s.id !== id))
      showToast('Session revoked')
    } catch { showToast('Failed to revoke session', 'error') }
  }

  const handleRevokeAll = async () => {
    if (!await confirm('Revoke all other sessions?', { variant: 'danger', title: 'Revoke sessions', confirmLabel: 'Revoke all' })) return
    try {
      const others = sessions.filter(s => !s.isCurrent)
      await Promise.all(others.map(s => userService.deleteSession(s.id)))
      setSessions(prev => prev.filter(s => s.isCurrent))
      showToast('All other sessions revoked')
    } catch { showToast('Failed to revoke sessions', 'error') }
  }

  // ── 2FA state from user record ───────────────────────────────────────────────
  const [twoFAEnabled] = useState<boolean>((user as any)?.twoFactorEnabled ?? false)

  const tabs = [
    { id: 'profile',       name: 'Profile Info',       icon: User   },
    { id: 'notifications', name: 'Notifications',      icon: Bell   },
    { id: 'security',      name: 'Security & Privacy', icon: Shield },
    { id: 'preferences',   name: 'App Preferences',    icon: Palette },
  ]

  return (
    <>
      <PageMeta title="Settings | Suraksha" description="Suraksha Settings Page" />
      <PageBreadcrumb pageTitle="Settings" />

      {toast && <Toast message={toast.msg} type={toast.type} />}

      {/* Change Password Modal */}
      {showPwModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-slate-800 rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Change Password</h3>
              <button onClick={() => setShowPwModal(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <DarkInput label="CURRENT PASSWORD" value={pwForm.current} type="password" icon={Lock} onChange={(v: string) => setPwForm(p => ({ ...p, current: v }))} />
              <DarkInput label="NEW PASSWORD" value={pwForm.next} type="password" icon={Key} onChange={(v: string) => setPwForm(p => ({ ...p, next: v }))} placeholder="Minimum 8 characters" />
              <DarkInput label="CONFIRM NEW PASSWORD" value={pwForm.confirm} type="password" icon={Key} onChange={(v: string) => setPwForm(p => ({ ...p, confirm: v }))} />
              {pwForm.next && pwForm.confirm && pwForm.next !== pwForm.confirm && (
                <p className="text-xs text-red-400 font-bold pl-1">Passwords do not match</p>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPwModal(false)} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800">Cancel</button>
                <button type="submit" disabled={pwSubmitting || !pwForm.current || !pwForm.next || !pwForm.confirm} className="flex-1 py-3 rounded-xl bg-blue-600 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {pwSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-8 animate-in fade-in duration-500 font-sans pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Sidebar */}
          <div className="lg:col-span-3 bg-white dark:bg-transparent rounded-2xl p-2 border border-gray-200 dark:border-transparent h-fit">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={cn("w-full flex items-center gap-3.5 px-5 py-4 rounded-xl text-sm font-semibold transition-all duration-300",
                  activeTab === tab.id
                    ? "bg-blue-600 dark:bg-slate-900 text-white shadow-lg dark:shadow-none dark:border dark:border-slate-800"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                )}>
                <tab.icon className={cn("w-5 h-5 flex-shrink-0", activeTab === tab.id ? "text-white" : "text-gray-400 dark:text-gray-400")} />
                <span className="tracking-tight">{tab.name}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="lg:col-span-9 bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-slate-800/60 rounded-3xl shadow-xl overflow-hidden min-h-[700px] text-gray-700 dark:text-slate-300">

            {/* ── PROFILE ───────────────────────────────────────────────────── */}
            {activeTab === 'profile' && (
              <div className="p-8 space-y-8 animate-in fade-in">
                <div className="space-y-1 pb-6 border-b border-gray-200 dark:border-slate-800">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Profile information</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Update your personal details and contact information</p>
                </div>

                {profileLoading ? (
                  <div className="flex items-center gap-3 text-gray-400"><Loader2 className="w-5 h-5 animate-spin" /> Loading profile…</div>
                ) : (
                  <>
                    <div className="flex gap-6 items-center">
                      <div className="relative group">
                        {profileData.profilePicture ? (
                          <img src={profileData.profilePicture} alt="Profile" className="w-20 h-20 rounded-2xl object-cover shadow-lg border border-slate-700" />
                        ) : (
                          <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                            {profileData.name.slice(0, 2).toUpperCase() || 'SY'}
                          </div>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                        <button type="button" onClick={() => fileInputRef.current?.click()}
                          className="absolute -bottom-2 -right-2 p-1.5 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full shadow-lg text-gray-500 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-700 transition-all"
                          title="Change photo">
                          <Camera className="w-4 h-4" />
                        </button>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{profileData.name}</h3>
                        <div className="flex items-center gap-2 mt-1 px-3 py-1 bg-gray-100 dark:bg-slate-800 rounded-full border border-gray-200 dark:border-slate-700 w-fit">
                          <Briefcase className="w-3 h-3 text-blue-400" />
                          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{profileData.designation}</span>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleProfileSave} className="space-y-6 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DarkInput label="FULL NAME" value={profileData.name} onChange={(v: string) => setProfileData({ ...profileData, name: v })} icon={User} />
                        <DarkInput label="EMAIL ADDRESS" value={profileData.email} disabled icon={Mail} />
                        <DarkInput label="PHONE NUMBER" value={profileData.phone} onChange={(v: string) => setProfileData({ ...profileData, phone: v })} icon={Phone} placeholder="+94 XX XXX XXXX" />
                        <DarkInput label="DESIGNATION / ROLE" value={profileData.designation} disabled icon={Briefcase} />
                      </div>

                      <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200 dark:border-slate-800">
                        <button type="button" onClick={() => setProfileData(savedProfile)}
                          className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700 transition-all">
                          Discard changes
                        </button>
                        <button type="submit" disabled={isSubmitting}
                          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20">
                          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Save changes
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            )}

            {/* ── NOTIFICATIONS ─────────────────────────────────────────────── */}
            {activeTab === 'notifications' && (
              <div className="p-8 space-y-8 animate-in fade-in">
                <div className="space-y-1 pb-6 border-b border-gray-200 dark:border-slate-800">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Notification preferences</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Control how and when you receive alerts. Preferences are saved to this browser.</p>
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Incident Alerts</h3>
                    <DarkToggle title="Critical (Severity 5) Alerts" desc="Immediate push notifications bypassing silent mode" checked={getPref('notif_crit', true)} onChange={(v: boolean) => updatePref('notif_crit', v)} />
                    <DarkToggle title="High / Medium (Severity 3–4) Alerts" desc="Standard push notifications during operational hours" checked={getPref('notif_high', true)} onChange={(v: boolean) => updatePref('notif_high', v)} />
                    <DarkToggle title="Low (Severity 1–2) Alerts" desc="In-app notifications only" checked={getPref('notif_low', false)} onChange={(v: boolean) => updatePref('notif_low', v)} />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Minimum SMS Severity</h3>
                    <div className="p-5 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-slate-800 space-y-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Select the minimum severity that triggers an SMS broadcast.</p>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(level => (
                          <button key={level} onClick={() => setMinSeverityPush(level)}
                            className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all border",
                              minSeverityPush === level ? "bg-red-500/20 text-red-400 border-red-500/50" : "bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700"
                            )}>
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Volunteer & Task Updates</h3>
                    <DarkToggle title="Task Accept / Decline Events" desc="Notify when a volunteer responds to a dispatch" checked={getPref('notif_task_acc', true)} onChange={(v: boolean) => updatePref('notif_task_acc', v)} />
                    <DarkToggle title="Task Completion Events" desc="Notify when a volunteer resolves a dispatch" checked={getPref('notif_task_comp', true)} onChange={(v: boolean) => updatePref('notif_task_comp', v)} />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">System & Reports</h3>
                    <DarkToggle title="Daily Digest Email" desc="Receive a daily summary of all command center activity" checked={getPref('notif_daily', false)} onChange={(v: boolean) => updatePref('notif_daily', v)} />
                    <DarkToggle title="ML Retraining Alerts" desc="Notify when the predictive model is updated" checked={getPref('notif_ml', false)} onChange={(v: boolean) => updatePref('notif_ml', v)} />
                    <DarkToggle title="New Volunteer Registrations" desc="Notify when new personnel join your sector" checked={getPref('notif_vol', true)} onChange={(v: boolean) => updatePref('notif_vol', v)} />
                  </div>
                </div>
              </div>
            )}

            {/* ── SECURITY ──────────────────────────────────────────────────── */}
            {activeTab === 'security' && (
              <div className="p-8 space-y-8 animate-in fade-in">
                <div className="space-y-1 pb-6 border-b border-gray-200 dark:border-slate-800">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Security & privacy</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Manage your account security, sessions, and privacy controls</p>
                </div>

                <div className="space-y-8">
                  {/* Security Status Cards */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Security Status</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-5 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold"><Key className="w-4 h-4 text-emerald-400" /> Password</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Change your login password</div>
                        </div>
                        <button onClick={() => setShowPwModal(true)}
                          className="px-3 py-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-white text-xs font-bold rounded-lg border border-gray-200 dark:border-slate-700 transition-all">
                          Change
                        </button>
                      </div>

                      <div className="p-5 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold"><Smartphone className="w-4 h-4 text-blue-400" /> Two-Factor Auth</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{twoFAEnabled ? 'Active — Google Authenticator' : 'Not configured'}</div>
                        </div>
                        <span className={cn("px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider border",
                          twoFAEnabled ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/20" : "bg-amber-500/20 text-amber-400 border-amber-500/20"
                        )}>
                          {twoFAEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>

                      <div className="p-5 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold"><HardDrive className="w-4 h-4 text-purple-400" /> Backup Codes</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">One-time recovery codes</div>
                        </div>
                        <button onClick={() => showToast('Re-authenticate to view backup codes')}
                          className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">View</button>
                      </div>

                      <div className="p-5 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold"><Monitor className="w-4 h-4 text-amber-400" /> API Token</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Used by field app & integrations</div>
                        </div>
                        <button onClick={async () => { if (await confirm('Regenerate will invalidate existing tokens. Proceed?', { variant: 'warning', title: 'Regenerate token', confirmLabel: 'Regenerate' })) showToast('API token regenerated') }}
                          className="px-3 py-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-white text-xs font-bold rounded-lg border border-gray-200 dark:border-slate-700 transition-all">
                          Regenerate
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Privacy Controls */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Privacy Controls</h3>
                    <DarkToggle title="Location Visibility" desc="Allow other command centers to see your active location" checked={getPref('priv_loc', true)} onChange={(v: boolean) => updatePref('priv_loc', v)} />
                    <DarkToggle title="Audit Log Sharing" desc="Share detailed action logs with the central analytics pool" checked={getPref('priv_audit', true)} onChange={(v: boolean) => updatePref('priv_audit', v)} />
                    <DarkToggle title="Login Alerts" desc="Email alerts for logins from unknown devices or locations" checked={getPref('priv_alerts', true)} onChange={(v: boolean) => updatePref('priv_alerts', v)} />
                  </div>

                  {/* Active Sessions */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Login History</h3>
                      {sessions.length > 1 && (
                        <button onClick={handleRevokeAll} className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors">
                          Revoke all other sessions
                        </button>
                      )}
                    </div>
                    <div className="border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-gray-50 dark:bg-slate-900/30">
                      {sessionsLoading ? (
                        <div className="p-6 flex items-center gap-3 text-gray-400"><Loader2 className="w-4 h-4 animate-spin" /> Loading sessions…</div>
                      ) : sessions.length === 0 ? (
                        <div className="p-6 text-sm text-gray-500">No session history found.</div>
                      ) : (
                        sessions.map((s, i) => (
                          <div key={s.id} className={cn("p-5 flex items-center justify-between", i !== 0 && "border-t border-gray-200 dark:border-slate-800")}>
                            <div className="flex items-center gap-4">
                              <div className="p-2.5 bg-gray-100 dark:bg-slate-800 rounded-xl">
                                <Monitor className="w-5 h-5 text-gray-500 dark:text-slate-300" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                  {s.device || 'Unknown device'}
                                </div>
                                <div className="text-xs text-gray-400 mt-0.5">
                                  {s.location || 'Unknown location'}{s.ipAddress ? ` • ${s.ipAddress}` : ''}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-xs text-gray-500 font-medium">
                                {new Date(s.loginTime).toLocaleDateString('en-LK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <button onClick={() => handleRevokeSession(s.id)}
                                className="text-xs font-bold text-gray-400 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20">
                                Revoke
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── PREFERENCES ───────────────────────────────────────────────── */}
            {activeTab === 'preferences' && (
              <div className="p-8 space-y-8 animate-in fade-in">
                <div className="space-y-1 pb-6 border-b border-gray-200 dark:border-slate-800">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">App Preferences</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Customize your workspace. Preferences are saved locally.</p>
                </div>

                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Interface Theme</h3>
                      <div className="grid grid-cols-3 gap-3">
                        {(['dark', 'light', 'system'] as const).map(t_theme => (
                          <button key={t_theme} onClick={() => setTheme(t_theme)}
                            className={cn("px-4 py-3 rounded-xl border flex flex-col items-center gap-2 transition-all",
                              theme === t_theme ? "bg-blue-500/10 border-blue-500/50 text-blue-600 dark:text-blue-400" : "bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                            )}>
                            {t_theme === 'dark' ? <Moon className="w-5 h-5" /> : t_theme === 'light' ? <Sun className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                            <span className="text-xs font-bold capitalize">{t_theme}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Primary Language</h3>
                      <DarkSelect
                        value={i18n.language}
                        onChange={(v: string) => i18n.changeLanguage(v)}
                        options={[{ v: 'en', l: 'English (US)' }, { v: 'si', l: 'සිංහල (Sinhala)' }, { v: 'ta', l: 'தமிழ் (Tamil)' }]}
                        icon={Globe}
                        useObj
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Default Map View</h3>
                      <div className="space-y-2">
                        {['standard', 'satellite', 'hybrid'].map(v => (
                          <label key={v} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                            <input type="radio" name="mapView" checked={mapView === v} onChange={() => setMapView(v)} className="w-4 h-4" />
                            <span className="text-sm font-bold text-gray-700 dark:text-slate-300 capitalize flex items-center gap-2">
                              {v === 'standard' ? <Map className="w-4 h-4" /> : v === 'satellite' ? <Globe className="w-4 h-4" /> : <List className="w-4 h-4" />}
                              {v.charAt(0).toUpperCase() + v.slice(1)} View
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Default Incident Sort</h3>
                      <div className="space-y-2">
                        {[
                          { v: 'severity', label: 'By Severity', icon: AlertTriangle },
                          { v: 'recent',   label: 'By Recent',   icon: Clock },
                          { v: 'distance', label: 'By Distance', icon: Map },
                        ].map(({ v, label, icon: Icon }) => (
                          <label key={v} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                            <input type="radio" name="sort" checked={incidentSort === v} onChange={() => setIncidentSort(v)} className="w-4 h-4" />
                            <span className="text-sm font-bold text-gray-700 dark:text-slate-300 flex items-center gap-2">
                              <Icon className="w-4 h-4" />{label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Dashboard Behavior</h3>
                    <DarkToggle title="Auto Refresh" desc="Poll server for new data every 30 seconds" checked={getPref('dash_refresh', true)} onChange={(v: boolean) => updatePref('dash_refresh', v)} />
                    <DarkToggle title="Sound Alerts for Critical Incidents" desc="Play a siren when a severity-5 incident arrives" checked={getPref('dash_sound', true)} onChange={(v: boolean) => updatePref('dash_sound', v)} />
                    <DarkToggle title="Show ML Confidence Scores" desc="Display predictive accuracy on incident rows" checked={getPref('dash_ml', true)} onChange={(v: boolean) => updatePref('dash_ml', v)} />
                    <DarkToggle title="Compact Table Mode" desc="Reduce padding in tables to show more rows" checked={getPref('dash_compact', false)} onChange={(v: boolean) => updatePref('dash_compact', v)} />
                    <DarkToggle title="Offline Sync Badge" desc="Show sync status indicator on the map" checked={getPref('dash_offline', true)} onChange={(v: boolean) => updatePref('dash_offline', v)} />
                  </div>

                  <div className="pt-6 border-t border-red-500/20">
                    <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Danger Zone
                    </h3>
                    <div className="flex gap-4 flex-wrap">
                      <button onClick={() => showToast('Data export started. You will receive an email when ready.')}
                        className="px-5 py-2.5 bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-bold text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-800 transition-all flex items-center gap-2">
                        <Download className="w-4 h-4" /> Export all data
                      </button>
                      <button onClick={async () => { if (await confirm('Request account deactivation? This requires administrator approval.', { variant: 'danger', title: 'Deactivate account', confirmLabel: 'Request deactivation' })) showToast('Deactivation request submitted') }}
                        className="px-5 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/20 transition-all flex items-center gap-2">
                        <Trash2 className="w-4 h-4" /> Deactivate account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  )
}
