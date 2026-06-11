import { useState, useEffect } from 'react'
import { CheckCircle2, AlertCircle, Loader2, Award, Clock, MapPin, HeartPulse, BookOpen, ShieldAlert, Navigation } from 'lucide-react'
import { cn } from '@/lib/utils'
import { volunteerService } from '@/services/api'
import { useAppStore } from '@/store/useAppStore'
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";

export default function VolunteerPage() {
  const { user } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [incidents, setIncidents] = useState<any[]>([])
  
  const [activeTab, setActiveTab] = useState('duty') // profile, duty, training, wellbeing, gamification
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null)

  // Forms
  const [skillName, setSkillName] = useState('')
  const [trainingData, setTrainingData] = useState({ trainingName: '', completedAt: '' })
  const [wellbeingData, setWellbeingData] = useState({ physicalRating: 5, mentalRating: 5, needsResources: false })

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await volunteerService.getProfile()
      setProfile(res.data)

      const incRes = await volunteerService.getRecommendedIncidents()
      setIncidents(incRes.data)
    } catch (error) {
      console.error('Failed to load profile:', error)
      showToast('Failed to load your volunteer profile.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!skillName) return
    try {
      setIsSubmitting(true)
      await volunteerService.addSkill({ skillName })
      showToast('Skill added successfully')
      setSkillName('')
      fetchData()
    } catch {
      showToast('Failed to add skill', 'error')
    } finally { setIsSubmitting(false) }
  }

  const handleAddTraining = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trainingData.trainingName || !trainingData.completedAt) return
    try {
      setIsSubmitting(true)
      await volunteerService.addTraining(trainingData)
      showToast('Training logged successfully')
      setTrainingData({ trainingName: '', completedAt: '' })
      fetchData()
    } catch {
      showToast('Failed to add training', 'error')
    } finally { setIsSubmitting(false) }
  }

  const handleCheckIn = () => {
    if (!navigator.geolocation) {
      return showToast('Geolocation is not supported by your browser', 'error')
    }
    
    setIsSubmitting(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await volunteerService.checkIn({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
          showToast('Checked in successfully. Stay safe!')
          fetchData()
        } catch {
          showToast('Check-in failed', 'error')
        } finally { setIsSubmitting(false) }
      },
      (err) => {
        showToast('Failed to get GPS location.', 'error')
        setIsSubmitting(false)
      }
    )
  }

  const handleCheckOut = async (checkInId: string) => {
    try {
      setIsSubmitting(true)
      await volunteerService.checkOut(checkInId)
      showToast('Checked out successfully. Thank you for your service!')
      fetchData()
    } catch {
      showToast('Failed to check out', 'error')
    } finally { setIsSubmitting(false) }
  }

  const handleWellbeingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      await volunteerService.submitWellbeing(wellbeingData)
      showToast('Wellbeing survey submitted. Support team notified if necessary.')
      fetchData()
    } catch {
      showToast('Failed to submit survey', 'error')
    } finally { setIsSubmitting(false) }
  }

  if (loading) {
    return (
          <>
            <PageMeta title="Volunteer | Suraksha" description="Suraksha Volunteer Page" />
            <PageBreadcrumb pageTitle="Volunteer" />
            <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>
          </>
        )
  }

  if (!profile) return <div>Could not load profile.</div>

  const activeCheckIn = profile.checkIns?.find((c: any) => !c.checkOutTime)

  return (
    <>
      <PageMeta title="Volunteer | Suraksha" description="Suraksha Volunteer Page" />
      <PageBreadcrumb pageTitle="Volunteer Headquarters" />
      <div className="space-y-8 animate-in fade-in duration-500 font-sans pb-10 w-full min-w-0">
        {/* Header */}
        <div className="mb-2">
          <p className="text-gray-500 dark:text-gray-400 font-medium">Welcome back, {user?.name}. Manage your deployments and skills.</p>
        </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 bg-white dark:bg-gray-900 p-2 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
        {[
          { id: 'duty', label: 'Field Duty', icon: Navigation },
          { id: 'profile', label: 'My Skills & Matching', icon: BookOpen },
          { id: 'training', label: 'Certifications', icon: Award },
          { id: 'wellbeing', label: 'Wellbeing', icon: HeartPulse },
          { id: 'gamification', label: 'Achievements', icon: Award },
        ].map(tab => (
          <button
            key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap",
              activeTab === tab.id ? "bg-slate-900 text-white shadow-md shadow-slate-900/20" : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:bg-gray-800/50"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* DUTY & CHECK-IN */}
      {activeTab === 'duty' && (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="suraksha-card p-8 rounded-[1.5rem] flex flex-col items-center justify-center text-center">
            {activeCheckIn ? (
              <div className="space-y-6">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
                  <Navigation className="w-10 h-10 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800">You are On Duty</h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Checked in at {new Date(activeCheckIn.checkInTime).toLocaleTimeString()}</p>
                </div>
                <button 
                  onClick={() => handleCheckOut(activeCheckIn.id)} disabled={isSubmitting}
                  className="bg-red-600 text-white font-bold py-4 px-10 rounded-xl hover:bg-red-700 transition-all flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : <Clock className="w-5 h-5"/>}
                  End Shift & Check Out
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                  <MapPin className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800">You are Off Duty</h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Ready to deploy? Capture your GPS location to start tracking your active hours.</p>
                </div>
                <button 
                  onClick={handleCheckIn} disabled={isSubmitting}
                  className="bg-brand-500 text-white font-bold py-4 px-10 rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center gap-2 mx-auto"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : <Navigation className="w-5 h-5"/>}
                  Start Shift & Check In
                </button>
              </div>
            )}
          </div>
          
          <div className="suraksha-card p-8 rounded-[1.5rem]">
            <h3 className="text-xl font-black text-gray-800 dark:text-white/90 mb-4">Check-In History</h3>
            <div className="space-y-3">
              {profile.checkIns?.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-sm">No duty history yet.</p>}
              {profile.checkIns?.map((ci: any) => (
                <div key={ci.id} className="p-4 border border-gray-200 dark:border-gray-800 rounded-xl flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                  <div>
                    <p className="font-bold text-sm text-slate-700">{new Date(ci.checkInTime).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(ci.checkInTime).toLocaleTimeString()} - {ci.checkOutTime ? new Date(ci.checkOutTime).toLocaleTimeString() : 'Active Now'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded text-xs">
                      {ci.activeHours ? `${ci.activeHours.toFixed(1)} hrs` : '...'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SKILLS & MATCHING */}
      {activeTab === 'profile' && (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="suraksha-card p-8 rounded-[1.5rem] h-fit">
            <h3 className="text-xl font-black text-gray-800 dark:text-white/90 mb-6">My Skills</h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {profile.skills?.length === 0 && <span className="text-gray-400 dark:text-gray-500 text-sm">No skills added yet.</span>}
              {profile.skills?.map((s: any) => (
                <span key={s.id} className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-sm">
                  {s.skillName}
                </span>
              ))}
            </div>
            <form onSubmit={handleAddSkill} className="flex gap-2">
              <input 
                type="text" placeholder="e.g. First Aid, Boat Op, Sinhala" required
                className="suraksha-input flex-1"
                value={skillName} onChange={e => setSkillName(e.target.value)}
              />
              <button type="submit" disabled={isSubmitting} className="bg-slate-900 text-white px-4 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all">Add</button>
            </form>
          </div>

          <div className="suraksha-card p-8 rounded-[1.5rem]">
            <h3 className="text-xl font-black text-gray-800 dark:text-white/90 mb-2">Recommended Incidents</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Auto-matched based on your skills and last known location.</p>
            
            <div className="space-y-4">
              {incidents.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">No active matches found.</p>}
              {incidents.map((inc: any) => (
                <div key={inc.id} className="p-4 border border-gray-200 dark:border-gray-800 rounded-xl hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-800">{inc.title}</h4>
                    <span className="bg-emerald-100 text-emerald-700 font-black text-xs px-2 py-1 rounded">Score: {inc.matchScore}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">{inc.description}</p>
                  <div className="mt-3 flex items-center gap-4 text-xs font-bold text-gray-400 dark:text-gray-500">
                    {inc.distance !== null && <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {inc.distance.toFixed(1)}km away</span>}
                    {inc.matchedSkills > 0 && <span className="flex items-center gap-1 text-blue-500"><BookOpen className="w-3 h-3"/> {inc.matchedSkills} skill matches</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TRAINING & CERTS */}
      {activeTab === 'training' && (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="suraksha-card p-8 rounded-[1.5rem] h-fit">
             <h3 className="text-xl font-black text-gray-800 dark:text-white/90 mb-6">Log New Certification</h3>
             <form onSubmit={handleAddTraining} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Training / Course Name</label>
                  <input 
                    type="text" required className="suraksha-input w-full"
                    value={trainingData.trainingName} onChange={e => setTrainingData({...trainingData, trainingName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Completion Date</label>
                  <input 
                    type="date" required className="suraksha-input w-full"
                    value={trainingData.completedAt} onChange={e => setTrainingData({...trainingData, completedAt: e.target.value})}
                  />
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full bg-brand-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-500/25">
                  Save Training Record
                </button>
             </form>
          </div>
          <div className="suraksha-card p-8 rounded-[1.5rem]">
            <h3 className="text-xl font-black text-gray-800 dark:text-white/90 mb-6">My Certifications</h3>
            <div className="space-y-3">
              {profile.trainings?.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-sm">No trainings logged yet.</p>}
              {profile.trainings?.map((t: any) => (
                <div key={t.id} className="p-4 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-700">{t.trainingName}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Completed: {new Date(t.completedAt).toLocaleDateString()}</p>
                  </div>
                  <Award className="w-6 h-6 text-yellow-500" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* WELLBEING */}
      {activeTab === 'wellbeing' && (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="suraksha-card p-8 rounded-[1.5rem] h-fit">
            <div className="flex items-center gap-3 mb-6">
               <HeartPulse className="w-8 h-8 text-rose-500" />
               <h3 className="text-xl font-black text-gray-800 dark:text-white/90">Daily Wellbeing Check</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">It takes 30 seconds. Your mental and physical health is our top priority during deployments.</p>
            <form onSubmit={handleWellbeingSubmit} className="space-y-6">
              <div>
                <label className="block font-bold text-slate-700 mb-2">Physical Condition (1=Exhausted, 5=Excellent)</label>
                <input 
                  type="range" min="1" max="5" 
                  className="w-full accent-rose-500"
                  value={wellbeingData.physicalRating} onChange={e => setWellbeingData({...wellbeingData, physicalRating: parseInt(e.target.value)})}
                />
                <div className="text-center font-black text-rose-600 mt-1">{wellbeingData.physicalRating} / 5</div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-2">Mental State (1=Struggling, 5=Great)</label>
                <input 
                  type="range" min="1" max="5" 
                  className="w-full accent-blue-500"
                  value={wellbeingData.mentalRating} onChange={e => setWellbeingData({...wellbeingData, mentalRating: parseInt(e.target.value)})}
                />
                <div className="text-center font-black text-blue-600 mt-1">{wellbeingData.mentalRating} / 5</div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                <input 
                  type="checkbox" id="res"
                  className="w-5 h-5 rounded text-amber-600"
                  checked={wellbeingData.needsResources} onChange={e => setWellbeingData({...wellbeingData, needsResources: e.target.checked})}
                />
                <label htmlFor="res" className="font-bold text-amber-900 text-sm">I urgently need supplies, backup, or support.</label>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold">
                Submit Survey
              </button>
            </form>
          </div>

          <div className="suraksha-card p-8 rounded-[1.5rem]">
            <h3 className="text-xl font-black text-gray-800 dark:text-white/90 mb-4">Past Check-ins</h3>
            <div className="space-y-3">
              {profile.wellbeingLogs?.map((log: any) => (
                <div key={log.id} className="p-4 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                  <div>
                     <p className="font-bold text-sm text-slate-700">{new Date(log.recordedAt).toLocaleDateString()}</p>
                     <div className="flex gap-3 mt-1">
                       <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Physical: {log.physicalRating}</span>
                       <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Mental: {log.mentalRating}</span>
                     </div>
                  </div>
                  {log.distressFlag && <ShieldAlert className="w-5 h-5 text-red-500" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* GAMIFICATION */}
      {activeTab === 'gamification' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="suraksha-card p-6 flex flex-col items-center justify-center text-center">
              <div className="text-4xl font-black text-blue-600 mb-1">{profile.totalHours.toFixed(0)}</div>
              <div className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Total Active Hours</div>
            </div>
            <div className="suraksha-card p-6 flex flex-col items-center justify-center text-center">
              <div className="text-4xl font-black text-emerald-600 mb-1">{profile.incidentsJoined}</div>
              <div className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Incidents Responded To</div>
            </div>
            <div className="suraksha-card p-6 flex flex-col items-center justify-center text-center">
              <div className="text-4xl font-black text-purple-600 mb-1">{profile.readinessScore}%</div>
              <div className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Readiness Score</div>
            </div>
          </div>

          <div className="suraksha-card p-8 rounded-[1.5rem]">
            <h3 className="text-xl font-black text-gray-800 dark:text-white/90 mb-6">Earned Badges</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {profile.badges?.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-sm col-span-full">No badges earned yet. Complete deployments and log training to start earning!</p>}
              
              {profile.badges?.map((b: any) => (
                <div key={b.id} className="p-6 bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
                   <Award className="w-10 h-10 text-amber-600 mb-3" />
                   <div className="font-black text-sm text-amber-900">{b.badgeType.replace('_', ' ')}</div>
                   <div className="text-[10px] font-bold text-amber-700/60 mt-1 uppercase">Earned {new Date(b.earnedAt).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
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
