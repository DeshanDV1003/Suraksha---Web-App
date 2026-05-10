import { useState, useEffect } from 'react'
import { User, ClipboardList, CheckCircle2, Clock, Shield, Star, Award, Phone, Loader2, Plus, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { volunteerService } from '@/services/api'
import { useAppStore } from '@/store/useAppStore'
import { useTranslation } from 'react-i18next'

interface Task {
  id: string
  title: string
  description: string
  status: string
  priority: string
  dueDate: string
  createdAt: string
  incident?: { title: string }
  assignedBy?: { name: string }
}

export default function VolunteerPage() {
  const { t } = useTranslation()
  const { searchQuery } = useAppStore()
  const [profile, setProfile] = useState<any>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'tasks' | 'profile'>('tasks')
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [profileRes, tasksRes] = await Promise.all([
        volunteerService.getProfile(),
        volunteerService.getMyTasks()
      ])
      setProfile(profileRes.data)
      setTasks(tasksRes.data)
    } catch (error) {
      console.error('Failed to fetch volunteer data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleUpdateStatus = async (taskId: string, status: string) => {
    try {
      await volunteerService.updateTaskStatus(taskId, status)
      fetchData()
    } catch (error) {
      console.error('Failed to update task status:', error)
      alert('Failed to update status')
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget as HTMLFormElement)
    const skills = (formData.get('skills') as string).split(',').map(s => s.trim())
    const availability = formData.get('availability') === 'on'

    try {
      setIsUpdating(true)
      await volunteerService.upsertProfile({ skills, availability })
      alert('Profile updated successfully')
      fetchData()
    } catch (error) {
      console.error('Failed to update profile:', error)
      alert('Failed to update profile')
    } finally {
      setIsUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Initializing Volunteer Portal</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header Card */}
      <div className="relative overflow-hidden bg-white border border-slate-100 rounded-[2rem] p-10 shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
            <Shield className="w-12 h-12 text-white" />
          </div>
          <div className="text-center md:text-left flex-1">
            <h1 className="text-4xl font-black text-[#1e293b] tracking-tight">{t('volunteers.title')}</h1>
            <p className="text-slate-500 mt-2 font-bold">{t('volunteers.subtitle')}</p>
          </div>
          <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl">
            <button 
              onClick={() => setActiveTab('tasks')}
              className={cn(
                "px-6 py-3 rounded-xl text-sm font-bold transition-all",
                activeTab === 'tasks' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Assignments
            </button>
            <button 
              onClick={() => setActiveTab('profile')}
              className={cn(
                "px-6 py-3 rounded-xl text-sm font-bold transition-all",
                activeTab === 'profile' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              My Profile
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-8">
          {activeTab === 'tasks' ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-[#1e293b] flex items-center gap-3">
                  <ClipboardList className="w-6 h-6 text-[#0061ff]" />
                  Assigned Tasks
                </h2>
                <span className="bg-[#eff6ff] text-[#0061ff] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                  {tasks.length} Active Assignments
                </span>
              </div>

              {tasks.filter(t => 
                t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.incident?.title?.toLowerCase().includes(searchQuery.toLowerCase())
              ).length === 0 ? (
                <div className="suraksha-card bg-white border border-dashed border-slate-200 rounded-[2.5rem] p-20 text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10 text-slate-200" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[#1e293b]">{searchQuery ? 'No matching tasks' : 'All caught up!'}</h3>
                    <p className="text-slate-400 mt-1 font-bold italic">{searchQuery ? `No results for "${searchQuery}"` : 'No tasks assigned to you at the moment.'}</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {tasks
                    .filter(t => 
                      t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      t.incident?.title?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((task) => (
                    <div key={task.id} className="group bg-white border border-slate-100 rounded-[1.5rem] p-8 hover:shadow-xl hover:shadow-blue-500/5 transition-all relative overflow-hidden">
                      <div className={cn(
                        "absolute top-0 left-0 w-1.5 h-full",
                        task.priority === 'CRITICAL' ? "bg-red-500" : 
                        task.priority === 'HIGH' ? "bg-orange-500" : "bg-blue-500"
                      )} />
                      
                      <div className="flex justify-between items-start mb-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3 mb-2">
                             <span className={cn(
                               "text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider",
                               task.priority === 'CRITICAL' ? "bg-red-50 text-red-600" : 
                               task.priority === 'HIGH' ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"
                             )}>
                               {task.priority}
                             </span>
                             <span className="text-slate-300 text-xs">•</span>
                             <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">{task.incident?.title || 'General Operation'}</span>
                          </div>
                          <h3 className="text-xl font-black text-[#1e293b] group-hover:text-[#0061ff] transition-colors">{task.title}</h3>
                          <p className="text-slate-500 text-sm font-bold leading-relaxed">{task.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Due Date</div>
                          <div className="flex items-center gap-2 text-slate-700 font-bold justify-end">
                            <Clock className="w-4 h-4 text-slate-300" />
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                            <User className="w-4 h-4 text-slate-400" />
                          </div>
                          <div className="text-xs">
                            <div className="text-slate-400 font-medium">Assigned by</div>
                            <div className="text-slate-700 font-bold">{task.assignedBy?.name || 'Admin'}</div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {task.status !== 'RESOLVED' ? (
                            <>
                              <button 
                                onClick={() => handleUpdateStatus(task.id, 'IN_PROGRESS')}
                                className={cn(
                                  "px-5 py-2.5 rounded-xl text-xs font-bold transition-all",
                                  task.status === 'IN_PROGRESS' ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                                )}
                              >
                                {task.status === 'IN_PROGRESS' ? 'In Progress' : 'Start Task'}
                              </button>
                              <button 
                                onClick={() => handleUpdateStatus(task.id, 'RESOLVED')}
                                className="px-5 py-2.5 bg-green-50 text-green-600 rounded-xl text-xs font-bold hover:bg-green-600 hover:text-white transition-all"
                              >
                                Complete
                              </button>
                            </>
                          ) : (
                            <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
                              <CheckCircle2 className="w-5 h-5" />
                              Completed
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="suraksha-card p-10 space-y-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-[#1e293b]">Volunteer Profile</h2>
                  <p className="text-slate-500 font-bold">Keep your skills and availability updated</p>
                </div>
                <div className={cn(
                  "px-4 py-2 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest",
                  profile?.availability ? "bg-green-50 text-green-600" : "bg-slate-100 text-slate-500"
                )}>
                  <div className={cn("w-2 h-2 rounded-full", profile?.availability ? "bg-green-500 animate-pulse" : "bg-slate-400")} />
                  {profile?.availability ? 'Available' : 'Offline'}
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Skills (comma separated)</label>
                    <input 
                      name="skills"
                      type="text"
                      defaultValue={profile?.skills?.join(', ') || ''}
                      placeholder="e.g. First Aid, Swimming, Cooking, Driving"
                      className="suraksha-input"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Status</label>
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <input 
                        name="availability"
                        type="checkbox"
                        defaultChecked={profile?.availability}
                        className="w-6 h-6 rounded-lg text-blue-600 focus:ring-blue-500 border-slate-200 transition-all cursor-pointer"
                      />
                      <span className="text-slate-600 font-bold">Active and Available for Tasks</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    disabled={isUpdating}
                    className="suraksha-button w-full md:w-auto px-10 py-4 h-14 flex items-center justify-center gap-2"
                  >
                    {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                    Update Volunteer Status
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          {/* Volunteer Stats */}
          <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              Impact Summary
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-blue-50 rounded-3xl text-center space-y-1">
                <div className="text-2xl font-black text-blue-600">{profile?.completedTasks || 0}</div>
                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Tasks Done</div>
              </div>
              <div className="p-5 bg-indigo-50 rounded-3xl text-center space-y-1">
                <div className="text-2xl font-black text-indigo-600">{profile?.rating?.toFixed(1) || '5.0'}</div>
                <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Rating</div>
              </div>
            </div>

            <div className="space-y-4 pt-2">
               <div className="flex items-center gap-4 text-slate-600">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                    <Award className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rank</div>
                    <div className="text-sm font-bold">Community Guardian</div>
                  </div>
               </div>
               <div className="flex items-center gap-4 text-slate-600">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Support Line</div>
                    <div className="text-sm font-bold">Emergency HQ: 1919</div>
                  </div>
               </div>
            </div>
          </div>

          {/* Tips/Safety Section */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2rem] p-8 text-white space-y-6 shadow-xl">
             <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <Shield className="w-6 h-6 text-blue-400" />
             </div>
             <div>
                <h3 className="text-xl font-bold">Safety Protocol</h3>
                <p className="text-slate-400 text-sm mt-2 leading-relaxed">Always wear your volunteer ID and safety gear when on duty. Report any hazardous conditions immediately.</p>
             </div>
             <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2 group">
                View Guidelines
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
             </button>
          </div>
        </div>
      </div>
    </div>
  )
}
