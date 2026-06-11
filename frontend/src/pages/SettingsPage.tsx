import { useState, useEffect, useRef } from 'react'
import { 
  User, Bell, Shield, Palette, 
  ChevronRight, Globe, Lock, Mail, 
  Phone, Briefcase, Camera, Save, Loader2, Moon, Sun,
  Monitor, Key, HardDrive, Download, Trash2, AlertTriangle,
  Smartphone, Map, List, Clock, X, Check, Eye
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { userService, authService } from '@/services/api'
import { useTranslation } from 'react-i18next'
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";

export default function SettingsPage() {
  const { t, i18n } = useTranslation()
  const { user, updateUser } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // App Preferences State
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')
  const [mapView, setMapView] = useState(localStorage.getItem('mapView') || 'hybrid')
  const [incidentSort, setIncidentSort] = useState(localStorage.getItem('incidentSort') || 'severity')

  // Toggle Preferences
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem('suraksha_prefs') || '{}')
    } catch { return {} }
  })

  const updatePref = (key: string, val: boolean) => {
    setPrefs(p => {
      const newP = { ...p, [key]: val }
      localStorage.setItem('suraksha_prefs', JSON.stringify(newP))
      return newP
    })
  }

  const getPref = (key: string, def = false) => prefs[key] ?? def

  // Profile Form State (Local Mock for new fields)
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    officeLocation: 'Colombo Command Center (Region 1)',
    designation: user?.role?.replace('_', ' ') || 'DMC Officer',
    employeeId: 'DMC-2024-0042',
    bio: 'Senior administrator overseeing Western Province disaster response coordination.',
    profilePicture: (user as any)?.profilePicture || null
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileData(prev => ({ ...prev, profilePicture: reader.result as string }))
        triggerToast('Profile picture ready to be saved')
      }
      reader.readAsDataURL(file)
    }
  }
  
  const [initialProfileData, setInitialProfileData] = useState(profileData)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  // Notification State
  const [minSeverityPush, setMinSeverityPush] = useState(parseInt(localStorage.getItem('minSeverityPush') || '4'))
  
  // Security State
  const [activeSessions, setActiveSessions] = useState([
    { id: '1', name: 'MacBook Pro 16"', location: 'Colombo, LK', ip: '192.168.1.45', time: 'Current session', current: true },
    { id: '2', name: 'iPhone 13 Pro', location: 'Kandy, LK', ip: '112.134.55.12', time: '2 hours ago', current: false },
    { id: '3', name: 'Windows PC (Chrome)', location: 'Galle, LK', ip: '175.157.33.2', time: '3 days ago', current: false }
  ])

  useEffect(() => {
    const root = window.document.documentElement
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => { localStorage.setItem('mapView', mapView) }, [mapView])
  useEffect(() => { localStorage.setItem('incidentSort', incidentSort) }, [incidentSort])
  useEffect(() => { localStorage.setItem('minSeverityPush', minSeverityPush.toString()) }, [minSeverityPush])

  const triggerToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg)
    setToastType(type)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      await userService.updateProfile({ name: profileData.name, phone: profileData.phone, profilePicture: profileData.profilePicture })
      updateUser({ name: profileData.name, phone: profileData.phone, profilePicture: profileData.profilePicture })
      
      setInitialProfileData(profileData)
      triggerToast('Profile saved successfully')
    } catch (error) {
      console.error('Update failed:', error)
      triggerToast('Failed to update profile', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleProfileDiscard = () => {
    setProfileData(initialProfileData)
  }

  const handleRevokeSession = (id: string) => {
    setActiveSessions(prev => prev.filter(s => s.id !== id))
    triggerToast('Session revoked')
  }
  
  const handleRevokeAllOther = () => {
    setActiveSessions(prev => prev.filter(s => s.current))
    triggerToast('All other sessions revoked')
  }

  const tabs = [
    { id: 'profile', name: t('profile_info'), icon: User },
    { id: 'notifications', name: t('notifications'), icon: Bell },
    { id: 'security', name: t('security_privacy'), icon: Shield },
    { id: 'preferences', name: t('app_preferences'), icon: Palette },
  ]

  return (
        <>
          <PageMeta title="Settings | Suraksha" description="Suraksha Settings Page" />
          <PageBreadcrumb pageTitle="Settings" />
          <div className="space-y-8 animate-in fade-in duration-500 font-sans pb-10 relative">
        <div>
          
          
        </div>

        {showToast && (
          <div className={cn(
            "fixed bottom-8 right-8 z-[100] animate-in fade-in slide-in-from-bottom-4 flex items-center gap-3 px-6 py-4 rounded-2xl border font-bold text-sm shadow-2xl backdrop-blur-md",
            toastType === 'success' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
          )}>
            {toastType === 'success' ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />} 
            {toastMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-3 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3.5 px-6 py-4 rounded-xl text-sm font-semibold transition-all duration-300 border border-transparent",
                  activeTab === tab.id 
                    ? "bg-slate-900 text-white shadow-xl shadow-slate-900/10 border-slate-800" 
                    : "text-gray-600 dark:text-gray-300 hover:bg-white dark:bg-gray-900 hover:border-gray-200 dark:border-gray-700"
                )}
              >
                <tab.icon className={cn("w-5 h-5 flex-shrink-0", activeTab === tab.id ? "text-white" : "text-gray-400 dark:text-gray-500")} />
                <span className="tracking-tight">{tab.name}</span>
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="lg:col-span-9 bg-[#1c2128] border border-slate-800/60 rounded-3xl shadow-xl overflow-hidden min-h-[700px] text-slate-300">
            
            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="p-8 space-y-8 animate-in fade-in">
                 <div className="space-y-1 pb-6 border-b border-slate-800">
                   <h2 className="text-lg font-bold text-white">Profile information</h2>
                   <p className="text-sm text-gray-400 dark:text-gray-500">Update your personal details and contact information</p>
                 </div>

                 <div className="flex gap-6 items-center">
                    <div className="relative group">
                      {profileData.profilePicture ? (
                        <img src={profileData.profilePicture} alt="Profile" className="w-20 h-20 rounded-2xl object-cover shadow-lg border border-slate-700" />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-brand-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                          {profileData.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute -bottom-2 -right-2 p-1.5 bg-slate-800 border border-slate-700 rounded-full shadow-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-all">
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>
                   <div>
                     <h3 className="text-xl font-bold text-white">{profileData.name}</h3>
                     <div className="flex items-center gap-2 mt-1 px-3 py-1 bg-slate-800 rounded-full border border-slate-700 w-fit">
                       <Briefcase className="w-3 h-3 text-blue-400" />
                       <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{profileData.designation}</span>
                     </div>
                   </div>
                 </div>

                 <form onSubmit={handleProfileSave} className="space-y-6 pt-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <DarkInput label="FULL NAME" value={profileData.name} onChange={(v: string) => setProfileData({...profileData, name: v})} icon={User} />
                      <DarkInput label="EMAIL ADDRESS" value={profileData.email} disabled icon={Mail} />
                      <DarkInput label="PHONE NUMBER" value={profileData.phone} onChange={(v: string) => setProfileData({...profileData, phone: v})} icon={Phone} />
                      <DarkSelect 
                        label="OFFICE LOCATION" 
                        value={profileData.officeLocation} 
                        onChange={(v: string) => setProfileData({...profileData, officeLocation: v})}
                        icon={Globe}
                        options={['Colombo Command Center (Region 1)', 'Kandy Ops Center', 'Galle Regional Hub']}
                      />
                      <DarkInput label="DESIGNATION" value={profileData.designation} onChange={(v: string) => setProfileData({...profileData, designation: v})} icon={Briefcase} />
                      <DarkInput label="EMPLOYEE ID" value={profileData.employeeId} disabled icon={Monitor} />
                   </div>
                   
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">BIO / NOTES</label>
                     <textarea 
                       className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 min-h-[100px]"
                       value={profileData.bio}
                       onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                     />
                   </div>

                   <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-800">
                      <button type="button" onClick={handleProfileDiscard} className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-300 bg-transparent hover:bg-slate-800 border border-slate-700 transition-all">
                        Discard changes
                      </button>
                      <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-500 hover:bg-blue-600 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20">
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save changes
                      </button>
                   </div>
                 </form>
              </div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <div className="p-8 space-y-8 animate-in fade-in">
                 <div className="space-y-1 pb-6 border-b border-slate-800">
                   <h2 className="text-lg font-bold text-white">Notification preferences</h2>
                   <p className="text-sm text-gray-400 dark:text-gray-500">Control how and when you receive alerts from the system</p>
                 </div>

                 <div className="space-y-8">
                   <div className="space-y-4">
                     <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Incident Alerts</h3>
                     <DarkToggle title="Critical (Severity 5) Alerts" desc="Immediate push notifications bypassing silent mode" checked={getPref('notif_crit', true)} onChange={(v: boolean) => updatePref('notif_crit', v)} />
                     <DarkToggle title="High/Medium (Severity 3-4) Alerts" desc="Standard push notifications during operational hours" checked={getPref('notif_high', true)} onChange={(v: boolean) => updatePref('notif_high', v)} />
                     <DarkToggle title="Low (Severity 1-2) Alerts" desc="In-app notifications only" checked={getPref('notif_low', false)} onChange={(v: boolean) => updatePref('notif_low', v)} />
                   </div>

                   <div className="space-y-4">
                     <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Alert Severity Thresholds</h3>
                     <div className="p-5 bg-slate-900/50 rounded-2xl border border-slate-800 space-y-4">
                       <p className="text-sm text-gray-400 dark:text-gray-500">Select the minimum incident severity that triggers an SMS broadcast to your device.</p>
                       <div className="flex gap-2">
                         {[1, 2, 3, 4, 5].map((level) => (
                           <button 
                             key={level}
                             onClick={() => setMinSeverityPush(level)}
                             className={cn(
                               "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all border",
                               minSeverityPush === level 
                                 ? "bg-red-500/20 text-red-400 border-red-500/50 shadow-lg shadow-red-500/20" 
                                 : "bg-slate-800 border-slate-700 text-gray-400 dark:text-gray-500 hover:bg-slate-700"
                             )}
                           >
                             {level}
                           </button>
                         ))}
                       </div>
                     </div>
                   </div>

                   <div className="space-y-4">
                     <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Volunteer & Task Updates</h3>
                     <DarkToggle title="Task Accept/Decline Events" desc="Notify when a volunteer responds to a dispatch" checked={getPref('notif_task_acc', true)} onChange={(v: boolean) => updatePref('notif_task_acc', v)} />
                     <DarkToggle title="Task Completion Events" desc="Notify when a volunteer resolves a dispatch" checked={getPref('notif_task_comp', true)} onChange={(v: boolean) => updatePref('notif_task_comp', v)} />
                   </div>

                   <div className="space-y-4">
                     <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">System & Reports</h3>
                     <DarkToggle title="Daily Digest" desc="Receive a daily summary of all command center activity via email" checked={getPref('notif_daily', false)} onChange={(v: boolean) => updatePref('notif_daily', v)} />
                     <DarkToggle title="ML Retraining Alerts" desc="Notify when the predictive model is updated" checked={getPref('notif_ml', false)} onChange={(v: boolean) => updatePref('notif_ml', v)} />
                     <DarkToggle title="New Volunteer Registrations" desc="Notify when new personnel join your sector" checked={getPref('notif_vol', true)} onChange={(v: boolean) => updatePref('notif_vol', v)} />
                   </div>
                 </div>
              </div>
            )}

            {/* SECURITY TAB */}
            {activeTab === 'security' && (
              <div className="p-8 space-y-8 animate-in fade-in">
                 <div className="space-y-1 pb-6 border-b border-slate-800">
                   <h2 className="text-lg font-bold text-white">Security & privacy</h2>
                   <p className="text-sm text-gray-400 dark:text-gray-500">Manage your account security, sessions, and privacy controls</p>
                 </div>

                 <div className="space-y-8">
                   <div className="space-y-4">
                     <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Security Status</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center justify-between">
                         <div className="space-y-1">
                           <div className="flex items-center gap-2 text-white font-bold"><Key className="w-4 h-4 text-emerald-400" /> Password Age</div>
                           <div className="text-xs text-gray-400 dark:text-gray-500">Last changed 45 days ago</div>
                         </div>
                         <button onClick={() => triggerToast('Password reset link sent to your email')} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-all border border-slate-700">Change</button>
                       </div>
                       <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center justify-between">
                         <div className="space-y-1">
                           <div className="flex items-center gap-2 text-white font-bold"><Smartphone className="w-4 h-4 text-blue-400" /> 2FA Status</div>
                           <div className="text-xs text-gray-400 dark:text-gray-500">Active (Google Authenticator)</div>
                         </div>
                         <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded uppercase tracking-wider border border-emerald-500/20">Enabled</span>
                       </div>
                       <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center justify-between">
                         <div className="space-y-1">
                           <div className="flex items-center gap-2 text-white font-bold"><HardDrive className="w-4 h-4 text-purple-400" /> Backup Codes</div>
                           <div className="text-xs text-gray-400 dark:text-gray-500">8 codes remaining</div>
                         </div>
                         <button onClick={() => triggerToast('Please re-authenticate to view backup codes')} className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">View</button>
                       </div>
                       <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center justify-between">
                         <div className="space-y-1">
                           <div className="flex items-center gap-2 text-white font-bold"><Monitor className="w-4 h-4 text-amber-400" /> API Tokens</div>
                           <div className="text-xs text-gray-400 dark:text-gray-500">Expires in 12 days</div>
                         </div>
                         <button onClick={() => { if(window.confirm('Warning: Regenerating will invalidate all existing API clients. Proceed?')) triggerToast('API Tokens regenerated') }} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-all border border-slate-700">Regenerate</button>
                       </div>
                     </div>
                   </div>

                   <div className="space-y-4">
                     <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Privacy Controls</h3>
                     <DarkToggle title="Location Visibility" desc="Allow other command centers to see your exact active location" checked={getPref('priv_loc', true)} onChange={(v: boolean) => updatePref('priv_loc', v)} />
                     <DarkToggle title="Audit Log Sharing" desc="Share detailed action logs with the central analytics pool" checked={getPref('priv_audit', true)} onChange={(v: boolean) => updatePref('priv_audit', v)} />
                     <DarkToggle title="Login Alerts" desc="Receive email alerts for logins from unknown devices or locations" checked={getPref('priv_alerts', true)} onChange={(v: boolean) => updatePref('priv_alerts', v)} />
                   </div>

                   <div className="space-y-4">
                     <div className="flex items-center justify-between">
                       <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Active Sessions</h3>
                       <button onClick={handleRevokeAllOther} className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors">Revoke all other sessions</button>
                     </div>
                     <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/30">
                       {activeSessions.map((session, i) => (
                         <div key={session.id} className={cn("p-5 flex items-center justify-between", i !== 0 && "border-t border-slate-800")}>
                           <div className="flex items-center gap-4">
                             <div className="p-2.5 bg-slate-800 rounded-xl">
                               <Monitor className="w-5 h-5 text-slate-300" />
                             </div>
                             <div>
                               <div className="text-sm font-bold text-white flex items-center gap-2">
                                 {session.name} 
                                 {session.current && <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] uppercase tracking-widest rounded border border-emerald-500/20">This device</span>}
                               </div>
                               <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{session.location} • {session.ip}</div>
                             </div>
                           </div>
                           <div className="flex items-center gap-6">
                             <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{session.time}</div>
                             {!session.current && (
                               <button onClick={() => handleRevokeSession(session.id)} className="text-xs font-bold text-gray-400 dark:text-gray-500 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20">
                                 Revoke
                               </button>
                             )}
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 </div>
              </div>
            )}

            {/* PREFERENCES TAB */}
            {activeTab === 'preferences' && (
              <div className="p-8 space-y-8 animate-in fade-in">
                 <div className="space-y-1 pb-6 border-b border-slate-800">
                   <h2 className="text-lg font-bold text-white">{t('app_preferences')}</h2>
                   <p className="text-sm text-gray-400 dark:text-gray-500">{t('settings_page.customize_workspace')}</p>
                 </div>

                 <div className="space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-4">
                       <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{t('settings_page.interface_theme')}</h3>
                       <div className="grid grid-cols-3 gap-3">
                         {['dark', 'light', 'system'].map(t_theme => (
                           <button 
                             key={t_theme}
                             onClick={() => setTheme(t_theme)}
                             className={cn(
                               "px-4 py-3 rounded-xl border flex flex-col items-center gap-2 transition-all",
                               theme === t_theme 
                                 ? "bg-blue-500/10 border-blue-500/50 text-blue-400" 
                                 : "bg-slate-900 border-slate-800 text-gray-400 dark:text-gray-500 hover:bg-slate-800"
                             )}
                           >
                             {t_theme === 'dark' ? <Moon className="w-5 h-5" /> : t_theme === 'light' ? <Sun className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                             <span className="text-xs font-bold capitalize">{t_theme === 'system' ? t('settings_page.system') : t(t_theme)}</span>
                           </button>
                         ))}
                       </div>
                     </div>

                     <div className="space-y-4">
                       <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{t('settings_page.primary_language')}</h3>
                       <DarkSelect 
                         value={i18n.language} 
                         onChange={(v: string) => i18n.changeLanguage(v)} 
                         options={[{v: 'en', l: 'English (US)'}, {v: 'si', l: 'Sinhala'}, {v: 'ta', l: 'Tamil'}]} 
                         icon={Globe}
                         useObj
                       />
                     </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-4">
                       <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{t('settings_page.default_map_view')}</h3>
                       <div className="space-y-2">
                         {['standard', 'satellite', 'hybrid'].map(v => (
                           <label key={v} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800 cursor-pointer hover:bg-slate-800 transition-colors">
                             <input type="radio" name="mapView" checked={mapView === v} onChange={() => setMapView(v)} className="w-4 h-4 text-brand-500 bg-slate-900 border-slate-700 focus:ring-[#0061ff]" />
                             <span className="text-sm font-bold text-slate-300 capitalize flex items-center gap-2">
                               {v === 'standard' ? <Map className="w-4 h-4" /> : v === 'satellite' ? <Globe className="w-4 h-4" /> : <List className="w-4 h-4" />}
                               {t(`settings_page.${v}_view`)}
                             </span>
                           </label>
                         ))}
                       </div>
                     </div>

                     <div className="space-y-4">
                       <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{t('settings_page.default_incident_sort')}</h3>
                       <div className="space-y-2">
                         {['severity', 'recent', 'distance'].map(v => (
                           <label key={v} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800 cursor-pointer hover:bg-slate-800 transition-colors">
                             <input type="radio" name="sort" checked={incidentSort === v} onChange={() => setIncidentSort(v)} className="w-4 h-4 text-brand-500 bg-slate-900 border-slate-700 focus:ring-[#0061ff]" />
                             <span className="text-sm font-bold text-slate-300 capitalize flex items-center gap-2">
                               {v === 'severity' ? <AlertTriangle className="w-4 h-4" /> : v === 'recent' ? <Clock className="w-4 h-4" /> : <Map className="w-4 h-4" />}
                               {t(`settings_page.by_${v}`)}
                             </span>
                           </label>
                         ))}
                       </div>
                     </div>
                   </div>

                   <div className="space-y-4">
                     <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{t('settings_page.dashboard_behavior')}</h3>
                     <DarkToggle title={t('settings_page.auto_refresh')} desc="Poll the server for new data every 30 seconds" checked={getPref('dash_refresh', true)} onChange={(v: boolean) => updatePref('dash_refresh', v)} />
                     <DarkToggle title="Sound Alerts for Critical Incidents" desc="Play a siren sound when a severity 5 incident arrives" checked={getPref('dash_sound', true)} onChange={(v: boolean) => updatePref('dash_sound', v)} />
                     <DarkToggle title="Show ML Confidence Scores" desc="Display predictive accuracy scores on incident rows" checked={getPref('dash_ml', true)} onChange={(v: boolean) => updatePref('dash_ml', v)} />
                     <DarkToggle title="Compact Table Mode" desc="Reduce padding in data tables to show more rows" checked={getPref('dash_compact', false)} onChange={(v: boolean) => updatePref('dash_compact', v)} />
                     <DarkToggle title="Offline Sync Badge" desc="Show the sync status indicator on the map view" checked={getPref('dash_offline', true)} onChange={(v: boolean) => updatePref('dash_offline', v)} />
                   </div>

                   <div className="pt-6 mt-6 border-t border-red-500/20">
                     <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Danger Zone</h3>
                     <div className="flex gap-4">
                       <button onClick={() => triggerToast('Data export started. You will receive an email when ready.')} className="px-5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm font-bold text-white hover:bg-slate-800 transition-all flex items-center gap-2">
                         <Download className="w-4 h-4" /> Export all data
                       </button>
                       <button onClick={() => { if(window.confirm('Are you sure you want to request account deactivation? This action requires administrator approval.')) triggerToast('Deactivation request sent') }} className="px-5 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all flex items-center gap-2">
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

function DarkInput({ label, value, type = 'text', icon: Icon, placeholder, onChange, disabled }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">{label}</label>
      <div className={cn("relative group", disabled && "opacity-60")}>
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 group-focus-within:text-blue-400 transition-colors">
          <Icon className="w-4 h-4" />
        </div>
        <input 
          type={type} 
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full h-12 bg-slate-900/50 border border-slate-800 rounded-xl pl-11 pr-4 text-sm font-bold text-white placeholder:text-gray-600 dark:text-gray-300 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
        />
      </div>
    </div>
  )
}

function DarkSelect({ label, value, options, icon: Icon, onChange, disabled, useObj = false }: any) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">{label}</label>}
      <div className={cn("relative group", disabled && "opacity-60")}>
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 group-focus-within:text-blue-400 transition-colors pointer-events-none">
          <Icon className="w-4 h-4" />
        </div>
        <select 
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          className="w-full h-12 bg-slate-900/50 border border-slate-800 rounded-xl pl-11 pr-10 text-sm font-bold text-white appearance-none cursor-pointer focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
        >
          {options.map((opt: any) => (
            <option key={useObj ? opt.v : opt} value={useObj ? opt.v : opt} className="bg-slate-900">
              {useObj ? opt.l : opt}
            </option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </div>
      </div>
    </div>
  )
}

function DarkToggle({ title, desc, checked = false, onChange }: any) {
  return (
    <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all group">
       <div className="space-y-0.5">
          <div className="text-sm font-bold text-white">{title}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 font-medium">{desc}</div>
       </div>
       <button 
         onClick={() => onChange?.(!checked)}
         className={cn(
           "w-11 h-6 rounded-full transition-all duration-300 p-1 flex items-center focus:outline-none",
           checked ? "bg-blue-500" : "bg-slate-700"
         )}
       >
         <div className={cn(
           "w-4 h-4 rounded-full bg-white dark:bg-gray-900 shadow-sm transition-all duration-300",
           checked ? "translate-x-5" : "translate-x-0"
         )} />
       </button>
    </div>
  )
}
