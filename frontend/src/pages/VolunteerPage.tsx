import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, AlertCircle, Loader2, Award, Clock, MapPin, HeartPulse, BookOpen, ShieldAlert, Navigation } from 'lucide-react'
import { cn } from '@/lib/utils'
import { volunteerService } from '@/services/api'
import { useAppStore } from '@/store/useAppStore'
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";

export default function VolunteerPage() {
  const { t } = useTranslation()
  const { user } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [incidents, setIncidents] = useState<any[]>([])

  const [activeTab, setActiveTab] = useState('duty')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null)

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
      showToast(t('volunteer_page.failed_load'), 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!skillName) return
    try {
      setIsSubmitting(true)
      await volunteerService.addSkill({ skillName })
      showToast(t('volunteer_page.skill_added'))
      setSkillName('')
      fetchData()
    } catch {
      showToast(t('volunteer_page.failed_skill'), 'error')
    } finally { setIsSubmitting(false) }
  }

  const handleAddTraining = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trainingData.trainingName || !trainingData.completedAt) return
    try {
      setIsSubmitting(true)
      await volunteerService.addTraining(trainingData)
      showToast(t('volunteer_page.training_logged'))
      setTrainingData({ trainingName: '', completedAt: '' })
      fetchData()
    } catch {
      showToast(t('volunteer_page.failed_training'), 'error')
    } finally { setIsSubmitting(false) }
  }

  const handleCheckIn = () => {
    if (!navigator.geolocation) return showToast(t('volunteer_page.geo_not_supported'), 'error')
    setIsSubmitting(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await volunteerService.checkIn({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
          showToast(t('volunteer_page.checked_in'))
          fetchData()
        } catch {
          showToast(t('volunteer_page.checkin_failed'), 'error')
        } finally { setIsSubmitting(false) }
      },
      () => {
        showToast(t('volunteer_page.gps_failed'), 'error')
        setIsSubmitting(false)
      }
    )
  }

  const handleCheckOut = async (checkInId: string) => {
    try {
      setIsSubmitting(true)
      await volunteerService.checkOut(checkInId)
      showToast(t('volunteer_page.checked_out'))
      fetchData()
    } catch {
      showToast(t('volunteer_page.checkout_failed'), 'error')
    } finally { setIsSubmitting(false) }
  }

  const handleWellbeingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      await volunteerService.submitWellbeing(wellbeingData)
      showToast(t('volunteer_page.wellbeing_submitted'))
      fetchData()
    } catch {
      showToast(t('volunteer_page.survey_failed'), 'error')
    } finally { setIsSubmitting(false) }
  }

  if (loading) {
    return (
      <>
        <PageMeta title="Volunteer | Suraksha" description="Suraksha Volunteer Page" />
        <PageBreadcrumb pageTitle={t('volunteer_page.tabs.field_duty')} />
        <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-cyan-400" /></div>
      </>
    )
  }

  if (!profile) return <div className="text-slate-400 p-8">{t('volunteer_page.no_profile')}</div>

  const activeCheckIn = profile.checkIns?.find((c: any) => !c.checkOutTime)

  return (
    <>
      <PageMeta title="Volunteer | Suraksha" description="Suraksha Volunteer Page" />
      <PageBreadcrumb pageTitle={t('volunteer_page.page_title')} />
      <div className="space-y-8 animate-in fade-in duration-500 font-sans pb-10 w-full min-w-0">
        <div className="mb-2">
          <p className="text-slate-400 font-medium">{t('volunteer_page.welcome', { name: user?.name })} {t('volunteer_page.welcome_subtitle')}</p>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto gap-2 bg-[#131f33] p-2 rounded-2xl shadow-sm border border-cyan-400/10">
          {[
            { id: 'duty', label: t('volunteer_page.tabs.field_duty'), icon: Navigation },
            { id: 'profile', label: t('volunteer_page.tabs.skills_matching'), icon: BookOpen },
            { id: 'training', label: t('volunteer_page.tabs.certifications'), icon: Award },
            { id: 'wellbeing', label: t('volunteer_page.tabs.wellbeing'), icon: HeartPulse },
            { id: 'gamification', label: t('volunteer_page.tabs.achievements'), icon: Award },
          ].map(tab => (
            <button
              key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-brand-500 text-white shadow-md shadow-cyan-500/20"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
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
                  <div className="w-24 h-24 bg-green-500/15 rounded-full flex items-center justify-center mx-auto animate-pulse">
                    <Navigation className="w-10 h-10 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white/90">{t('volunteer_page.on_duty')}</h3>
                    <p className="text-slate-400 mt-2 text-sm">{t('volunteer_page.checked_in_at')} {new Date(activeCheckIn.checkInTime).toLocaleTimeString()}</p>
                  </div>
                  <button
                    onClick={() => handleCheckOut(activeCheckIn.id)} disabled={isSubmitting}
                    className="bg-red-500/80 hover:bg-red-500 text-white font-bold py-4 px-10 rounded-xl transition-all flex items-center gap-2 mx-auto"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : <Clock className="w-5 h-5"/>}
                    {t('volunteer_page.end_shift')}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                    <MapPin className="w-10 h-10 text-slate-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white/90">{t('volunteer_page.off_duty')}</h3>
                    <p className="text-slate-400 mt-2 text-sm">{t('volunteer_page.duty_prompt')}</p>
                  </div>
                  <button
                    onClick={handleCheckIn} disabled={isSubmitting}
                    className="bg-brand-500 text-white font-bold py-4 px-10 rounded-xl hover:shadow-lg hover:shadow-cyan-500/20 transition-all flex items-center gap-2 mx-auto"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : <Navigation className="w-5 h-5"/>}
                    {t('volunteer_page.start_shift')}
                  </button>
                </div>
              )}
            </div>

            <div className="suraksha-card p-8 rounded-[1.5rem]">
              <h3 className="text-xl font-black text-white/90 mb-4">{t('volunteer_page.check_in_history')}</h3>
              <div className="space-y-3">
                {profile.checkIns?.length === 0 && <p className="text-slate-400 text-sm">{t('volunteer_page.no_duty_history')}</p>}
                {profile.checkIns?.map((ci: any) => (
                  <div key={ci.id} className="p-4 border border-white/10 rounded-xl flex justify-between items-center bg-white/5">
                    <div>
                      <p className="font-bold text-sm text-white/80">{new Date(ci.checkInTime).toLocaleDateString()}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(ci.checkInTime).toLocaleTimeString()} — {ci.checkOutTime ? new Date(ci.checkOutTime).toLocaleTimeString() : t('volunteer_page.active_now')}
                      </p>
                    </div>
                    <span className="bg-blue-500/15 text-blue-400 font-bold px-3 py-1 rounded text-xs">
                      {ci.activeHours ? `${ci.activeHours.toFixed(1)} ${t('volunteer_page.hrs')}` : '...'}
                    </span>
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
              <h3 className="text-xl font-black text-white/90 mb-6">{t('volunteer_page.my_skills')}</h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {profile.skills?.length === 0 && <span className="text-slate-500 text-sm">{t('volunteer_page.no_skills')}</span>}
                {profile.skills?.map((s: any) => (
                  <span key={s.id} className="bg-white/8 border border-white/10 text-slate-200 font-bold px-3 py-1.5 rounded-lg text-sm">
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
                <button type="submit" disabled={isSubmitting} className="bg-brand-500 text-white px-4 rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-cyan-500/20 transition-all disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t('volunteer_page.add')}
                </button>
              </form>
            </div>

            <div className="suraksha-card p-8 rounded-[1.5rem]">
              <h3 className="text-xl font-black text-white/90 mb-2">{t('volunteer_page.recommended_incidents')}</h3>
              <p className="text-slate-400 text-sm mb-6">{t('volunteer_page.auto_matched')}</p>
              <div className="space-y-4">
                {incidents.length === 0 && (
                  <p className="text-slate-400 text-sm text-center py-4 bg-white/5 rounded-xl">
                    {t('volunteer_page.no_matches')}
                  </p>
                )}
                {incidents.map((inc: any) => (
                  <div key={inc.id} className="p-4 border border-white/10 rounded-xl hover:bg-white/5 transition-all">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-white/90">{inc.title}</h4>
                      <span className="bg-emerald-500/15 text-emerald-400 font-black text-xs px-2 py-1 rounded whitespace-nowrap ml-2">{t('volunteer_page.score')} {inc.matchScore}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">{inc.description}</p>
                    <div className="mt-3 flex items-center gap-4 text-xs font-bold text-slate-500">
                      {inc.distance !== null && <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {inc.distance.toFixed(1)}{t('volunteer_page.km_away')}</span>}
                      {inc.matchedSkills > 0 && <span className="flex items-center gap-1 text-cyan-400"><BookOpen className="w-3 h-3"/> {inc.matchedSkills} {inc.matchedSkills > 1 ? t('volunteer_page.skill_matches') : t('volunteer_page.skill_match')}</span>}
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
              <h3 className="text-xl font-black text-white/90 mb-6">{t('volunteer_page.log_certification')}</h3>
              <form onSubmit={handleAddTraining} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{t('volunteer_page.course_name')}</label>
                  <input
                    type="text" required className="suraksha-input w-full"
                    value={trainingData.trainingName} onChange={e => setTrainingData({...trainingData, trainingName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{t('volunteer_page.completion_date')}</label>
                  <input
                    type="date" required className="suraksha-input w-full"
                    value={trainingData.completedAt} onChange={e => setTrainingData({...trainingData, completedAt: e.target.value})}
                  />
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full bg-brand-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-cyan-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : null}
                  {t('volunteer_page.save_training')}
                </button>
              </form>
            </div>
            <div className="suraksha-card p-8 rounded-[1.5rem]">
              <h3 className="text-xl font-black text-white/90 mb-6">{t('volunteer_page.my_certifications')}</h3>
              <div className="space-y-3">
                {profile.trainings?.length === 0 && <p className="text-slate-400 text-sm">{t('volunteer_page.no_trainings')}</p>}
                {profile.trainings?.map((tr: any) => (
                  <div key={tr.id} className="p-4 border border-white/10 rounded-xl bg-white/5 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white/80">{tr.trainingName}</h4>
                      <p className="text-xs text-slate-400 mt-1">{t('volunteer_page.completed')} {new Date(tr.completedAt).toLocaleDateString()}</p>
                    </div>
                    <Award className="w-6 h-6 text-yellow-400 shrink-0" />
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
                <HeartPulse className="w-8 h-8 text-rose-400" />
                <h3 className="text-xl font-black text-white/90">{t('volunteer_page.daily_wellbeing')}</h3>
              </div>
              <p className="text-sm text-slate-400 mb-6">{t('volunteer_page.wellbeing_prompt')}</p>
              <form onSubmit={handleWellbeingSubmit} className="space-y-6">
                <div>
                  <label className="block font-bold text-white/80 mb-2">{t('volunteer_page.physical_condition')}</label>
                  <input
                    type="range" min="1" max="5"
                    className="w-full accent-rose-500"
                    value={wellbeingData.physicalRating} onChange={e => setWellbeingData({...wellbeingData, physicalRating: parseInt(e.target.value)})}
                  />
                  <div className="text-center font-black text-rose-400 mt-1">{wellbeingData.physicalRating} / 5</div>
                </div>
                <div>
                  <label className="block font-bold text-white/80 mb-2">{t('volunteer_page.mental_state')}</label>
                  <input
                    type="range" min="1" max="5"
                    className="w-full accent-blue-500"
                    value={wellbeingData.mentalRating} onChange={e => setWellbeingData({...wellbeingData, mentalRating: parseInt(e.target.value)})}
                  />
                  <div className="text-center font-black text-blue-400 mt-1">{wellbeingData.mentalRating} / 5</div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                  <input
                    type="checkbox" id="res"
                    className="w-5 h-5 rounded accent-amber-500"
                    checked={wellbeingData.needsResources} onChange={e => setWellbeingData({...wellbeingData, needsResources: e.target.checked})}
                  />
                  <label htmlFor="res" className="font-bold text-amber-300 text-sm">{t('volunteer_page.needs_support')}</label>
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full bg-brand-500 text-white py-4 rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-cyan-500/20 transition-all">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : null}
                  {t('volunteer_page.submit_survey')}
                </button>
              </form>
            </div>

            <div className="suraksha-card p-8 rounded-[1.5rem]">
              <h3 className="text-xl font-black text-white/90 mb-4">{t('volunteer_page.past_wellbeing_logs')}</h3>
              <div className="space-y-3">
                {(!profile.wellbeingLogs || profile.wellbeingLogs.length === 0) && (
                  <p className="text-slate-400 text-sm">{t('volunteer_page.no_wellbeing_logs')}</p>
                )}
                {profile.wellbeingLogs?.map((log: any) => (
                  <div key={log.id} className="p-4 border border-white/10 rounded-xl bg-white/5 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-white/80">{new Date(log.recordedAt).toLocaleDateString()}</p>
                      <div className="flex gap-3 mt-1">
                        <span className="text-xs font-bold text-slate-400">{t('volunteer_page.physical')}: <span className="text-white/70">{log.physicalRating}/5</span></span>
                        <span className="text-xs font-bold text-slate-400">{t('volunteer_page.mental')}: <span className="text-white/70">{log.mentalRating}/5</span></span>
                      </div>
                    </div>
                    {log.distressFlag && (
                      <div className="flex items-center gap-1.5 bg-red-500/15 px-2 py-1 rounded text-red-400 text-xs font-bold">
                        <ShieldAlert className="w-4 h-4" /> {t('volunteer_page.distress')}
                      </div>
                    )}
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
                <div className="text-4xl font-black text-blue-400 mb-1">{profile.totalHours.toFixed(0)}</div>
                <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{t('volunteer_page.total_active_hours')}</div>
              </div>
              <div className="suraksha-card p-6 flex flex-col items-center justify-center text-center">
                <div className="text-4xl font-black text-emerald-400 mb-1">{profile.incidentsJoined}</div>
                <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{t('volunteer_page.incidents_responded')}</div>
              </div>
              <div className="suraksha-card p-6 flex flex-col items-center justify-center text-center">
                <div className="text-4xl font-black text-purple-400 mb-1">{profile.readinessScore}%</div>
                <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{t('volunteer_page.readiness_score')}</div>
              </div>
            </div>

            <div className="suraksha-card p-8 rounded-[1.5rem]">
              <h3 className="text-xl font-black text-white/90 mb-6">{t('volunteer_page.earned_badges')}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {profile.badges?.length === 0 && (
                  <p className="text-slate-400 text-sm col-span-full">{t('volunteer_page.no_badges')}</p>
                )}
                {profile.badges?.map((b: any) => (
                  <div key={b.id} className="p-6 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex flex-col items-center justify-center text-center">
                    <Award className="w-10 h-10 text-amber-400 mb-3" />
                    <div className="font-black text-sm text-amber-300">{b.badgeType.replace('_', ' ')}</div>
                    <div className="text-[10px] font-bold text-amber-400/50 mt-1 uppercase">{t('volunteer_page.earned')} {new Date(b.earnedAt).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div className={cn(
            "fixed bottom-8 right-8 z-[999999] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-8 duration-300 font-sans",
            toast.type === 'success'
              ? "bg-[#131f33] text-emerald-400 border border-emerald-500/30"
              : "bg-[#131f33] text-red-400 border border-red-500/30"
          )}>
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-bold text-sm tracking-wide">{toast.message}</span>
          </div>
        )}
      </div>
    </>
  )
}
