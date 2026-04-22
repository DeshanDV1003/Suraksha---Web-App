import { useState, useEffect } from 'react'
import { 
  User, Bell, Shield, Palette, 
  ChevronRight, Globe, Lock, Mail, 
  Phone, Briefcase, Camera, Save, Loader2, Moon, Sun
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { userService, authService } from '@/services/api'

export default function SettingsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')

  // Profile States
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')

  // Password States
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (user) {
      setName(user.name)
      setPhone(user.phone || '')
    }
  }, [user])

  // Theme Handling
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      await userService.updateProfile({ name, phone })
      alert('Profile updated successfully! Refresh to see changes.')
    } catch (error) {
      console.error('Update failed:', error)
      alert('Failed to update profile')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      return alert('Passwords do not match')
    }
    
    try {
      setIsSubmitting(true)
      await authService.changePassword({ currentPassword, newPassword })
      alert('Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      console.error('Password change failed:', error)
      alert(error.response?.data?.message || 'Failed to change password')
    } finally {
      setIsSubmitting(false)
    }
  }

  const tabs = [
    { id: 'profile', name: 'Profile Information', icon: User },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security & Privacy', icon: Shield },
    { id: 'preferences', name: 'App Preferences', icon: Palette },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans pb-10">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-[#1e293b] dark:text-white transition-colors">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-bold uppercase text-[10px] tracking-[0.2em] opacity-70">Manage your command center account</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3.5 px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-300",
                activeTab === tab.id 
                  ? "bg-[#0061ff] text-white shadow-lg shadow-blue-500/20" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#0061ff] dark:hover:text-blue-400"
              )}
            >
              <tab.icon className="w-5 h-5 flex-shrink-0" />
              <span className="tracking-tight">{tab.name}</span>
              {activeTab === tab.id && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[600px] transition-colors">
          {activeTab === 'profile' && (
            <div className="p-10 space-y-10">
               {/* Profile Header */}
               <div className="flex items-center gap-8 pb-10 border-b border-slate-50 dark:border-slate-800">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#0061ff] to-[#00c6ff] flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-blue-500/20">
                      {user?.name?.slice(0, 2).toUpperCase() || 'AD'}
                    </div>
                    <button className="absolute -bottom-2 -right-2 p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 text-[#0061ff] hover:scale-110 transition-all active:scale-95 group-hover:bg-[#0061ff] group-hover:text-white">
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-[#1e293b] dark:text-white">{user?.name || 'Command Center User'}</h3>
                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-full w-fit">
                      <Briefcase className="w-3 h-3 text-[#0061ff] dark:text-blue-400" />
                      <span className="text-[10px] font-black text-[#0061ff] dark:text-blue-400 uppercase tracking-widest">{user?.role?.replace('_', ' ') || 'DMC Officer'}</span>
                    </div>
                  </div>
               </div>

               {/* Profile Form */}
               <form onSubmit={handleProfileUpdate} className="space-y-10">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <SettingInput label="Full Name" value={name} onChange={(val: string) => setName(val)} icon={User} />
                    <SettingInput label="Email Address" value={user?.email} disabled icon={Mail} />
                    <SettingInput label="Phone Number" value={phone} onChange={(val: string) => setPhone(val)} placeholder="+94 7X XXX XXXX" icon={Phone} />
                    <SettingInput label="Office Location" value="Colombo Command Center (Region 3)" disabled icon={Globe} />
                 </div>

                 <div className="pt-6">
                   <button 
                    disabled={isSubmitting}
                    className="suraksha-button flex items-center justify-center gap-2 h-12 px-8 min-w-[160px]"
                   >
                     {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                     Save Changes
                   </button>
                 </div>
               </form>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="p-10 space-y-8">
               <h3 className="text-xl font-black text-[#1e293b] dark:text-white mb-8">Notification Preferences</h3>
               <div className="space-y-4">
                  <ToggleItem title="Critical Incident Alerts" desc="Immediate SMS and Push notifications for severity 5+ events" checked />
                  <ToggleItem title="Volunteer Dispatches" desc="Notify when new volunteers are assigned to your sector" checked />
                  <ToggleItem title="Report Summaries" desc="Daily system health and activity summaries via email" />
                  <ToggleItem title="System Updates" desc="Notices about platform maintenance and feature updates" checked />
               </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="p-10 space-y-10">
               <h3 className="text-xl font-black text-[#1e293b] dark:text-white">Security Settings</h3>
               
               <form onSubmit={handleChangePassword} className="space-y-10">
                 <div className="max-w-md space-y-6">
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                       <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-2xl">
                          <Lock className="w-6 h-6 text-[#0061ff] dark:text-blue-400" />
                       </div>
                       <div>
                          <div className="text-sm font-black text-[#1e293b] dark:text-white">Two-Factor Authentication</div>
                          <div className="text-[11px] font-bold text-slate-400">Add an extra layer of security</div>
                       </div>
                       <button type="button" className="ml-auto text-xs font-black text-[#0061ff] dark:text-blue-400 uppercase tracking-widest">Enable</button>
                    </div>

                    <div className="space-y-4 pt-4">
                      <SettingInput 
                        label="Current Password" 
                        type="password" 
                        value={currentPassword} 
                        onChange={(val: string) => setCurrentPassword(val)} 
                        icon={Lock} 
                        required
                      />
                      <SettingInput 
                        label="New Password" 
                        type="password" 
                        value={newPassword} 
                        onChange={(val: string) => setNewPassword(val)} 
                        placeholder="Min 8 characters" 
                        icon={Lock} 
                        required
                      />
                      <SettingInput 
                        label="Confirm New Password" 
                        type="password" 
                        value={confirmPassword} 
                        onChange={(val: string) => setConfirmPassword(val)} 
                        icon={Lock} 
                        required
                      />
                    </div>
                 </div>

                 <div className="pt-6">
                   <button 
                    disabled={isSubmitting}
                    className="suraksha-button flex items-center justify-center gap-2 h-12 px-8 min-w-[180px]"
                   >
                     {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                     Update Password
                   </button>
                 </div>
               </form>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="p-10 space-y-10">
               <h3 className="text-xl font-black text-[#1e293b] dark:text-white">Personalization</h3>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 italic">Display Mode</label>
                     <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => setTheme('light')}
                          className={cn(
                            "flex items-center justify-center gap-2 p-5 rounded-3xl border-2 transition-all",
                            theme === 'light' 
                              ? "border-[#0061ff] bg-blue-50 text-[#0061ff]" 
                              : "border-slate-100 dark:border-slate-800 text-slate-400 bg-white dark:bg-slate-900"
                          )}
                        >
                           <Sun className="w-4 h-4" />
                           <span className="text-sm font-black">Light</span>
                        </button>
                        <button 
                          onClick={() => setTheme('dark')}
                          className={cn(
                            "flex items-center justify-center gap-2 p-5 rounded-3xl border-2 transition-all",
                            theme === 'dark' 
                              ? "border-[#0061ff] bg-blue-900/20 text-white" 
                              : "border-slate-100 dark:border-slate-800 text-slate-400 bg-white dark:bg-slate-900"
                          )}
                        >
                           <Moon className="w-4 h-4" />
                           <span className="text-sm font-black">Dark</span>
                        </button>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 italic">Primary Language</label>
                     <div className="relative">
                       <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                       <select 
                          onChange={(e) => alert(`Language changed to ${e.target.value}`)}
                          className="suraksha-input pl-11 appearance-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                        >
                          <option value="English">English (US)</option>
                          <option value="Sinhala">Sinhala (සිංහල)</option>
                          <option value="Tamil">Tamil (தமிழ்)</option>
                       </select>
                     </div>
                  </div>
               </div>

               <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm">
                        <Palette className="w-6 h-6 text-[#0061ff]" />
                     </div>
                     <div>
                        <h4 className="text-sm font-black text-[#1e293b] dark:text-white uppercase tracking-tight">Appearance Sync</h4>
                        <p className="text-[11px] font-bold text-slate-400">Settings are applied instantly to your local device</p>
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SettingInput({ label, value, type = 'text', icon: Icon, placeholder, onChange, disabled, required }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 italic transition-colors dark:text-slate-500">{label}</label>
      <div className={cn("relative group transition-opacity", disabled && "opacity-60")}>
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within:text-[#0061ff] transition-colors">
          <Icon className="w-4 h-4" />
        </div>
        <input 
          type={type} 
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className="suraksha-input pl-11 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-600"
        />
      </div>
    </div>
  )
}

function ToggleItem({ title, desc, checked = false }: any) {
  const [isOn, setIsOn] = useState(checked)
  return (
    <div className="flex items-center justify-between p-6 rounded-[2rem] bg-slate-50/50 dark:bg-slate-800/30 border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-all group">
       <div className="space-y-1">
          <div className="text-sm font-black text-[#1e293b] dark:text-white">{title}</div>
          <div className="text-[11px] font-bold text-slate-400">{desc}</div>
       </div>
       <button 
         onClick={() => setIsOn(!isOn)}
         className={cn(
           "w-12 h-6 rounded-full transition-all duration-300 p-1 flex items-center",
           isOn ? "bg-[#0061ff]" : "bg-slate-200 dark:bg-slate-700"
         )}
       >
         <div className={cn(
           "w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300",
           isOn ? "translate-x-6" : "translate-x-0"
         )} />
       </button>
    </div>
  )
}
