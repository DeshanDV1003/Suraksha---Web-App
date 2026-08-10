import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { UserSearch, Plus, X, MapPin, Loader2, User, Phone, BrainCircuit, Activity, Users, ShieldAlert, CheckCircle2, Trash2, CheckCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { missingPersonService } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";

export default function MissingPersonsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const isCitizen = (user as any)?.role === 'CITIZEN'
  const [persons, setPersons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedPerson, setSelectedPerson] = useState<any>(null)
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'|'warning'} | null>(null)

  const [activeTab, setActiveTab] = useState('active')

  const [aiLoading, setAiLoading] = useState(false)
  const [aiMatches, setAiMatches] = useState<any[]>([])
  const [crossRefLoading, setCrossRefLoading] = useState(false)
  const [crossRefMatches, setCrossRefMatches] = useState<any[]>([])

  const [reunificationNotes, setReunificationNotes] = useState('')
  const [isReunifying, setIsReunifying] = useState(false)

  // Form state
  const [isUnidentified, setIsUnidentified] = useState(false)

  const showToast = (message: string, type: 'success'|'error'|'warning' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setSelectedImage(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await missingPersonService.getMissing()
      setPersons(res.data)
      // Refresh selectedPerson if one is open
      if (selectedPerson) {
        const updated = res.data.find((p: any) => p.id === selectedPerson.id)
        if (updated) setSelectedPerson(updated)
      }
    } catch (error) {
      console.error('Failed to fetch missing persons:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'active' || activeTab === 'unidentified') fetchData()
  }, [activeTab])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget as HTMLFormElement)
    const data = {
      name: formData.get('name'),
      age: parseInt(formData.get('age') as string) || null,
      gender: formData.get('gender'),
      description: formData.get('description'),
      lastSeen: formData.get('lastSeen'),
      contactName: formData.get('contactName'),
      contactPhone: formData.get('contactPhone'),
      isUnidentified,
      photo: selectedImage || ''
    }

    try {
      setIsSubmitting(true)
      await missingPersonService.reportMissing(data)
      setShowModal(false)
      setSelectedImage(null)
      setIsUnidentified(false)
      showToast('Report filed successfully')
      fetchData()
    } catch (error) {
      console.error(error)
      showToast('Failed to file report', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAiSearch = async () => {
    if (!selectedImage) { showToast('Upload a photo first', 'warning'); return }
    setAiLoading(true)
    setAiMatches([])
    try {
      const res = await missingPersonService.searchFace('mock_url')
      setAiMatches(res.data)
      if (res.data.length === 0) showToast('No matches found in database', 'warning')
    } catch (e) {
      showToast('AI scan failed', 'error')
    } finally {
      setAiLoading(false)
    }
  }

  const handleCrossReference = async () => {
    setCrossRefLoading(true)
    setCrossRefMatches([])
    try {
      const res = await missingPersonService.runCrossReference()
      setCrossRefMatches(res.data)
      if (res.data.length === 0) showToast('No cross-reference matches found', 'warning')
    } catch (e) {
      showToast('Cross-reference scan failed', 'error')
    } finally {
      setCrossRefLoading(false)
    }
  }

  const handleReunify = async (status: string) => {
    if (!selectedPerson) return
    try {
      setIsReunifying(true)
      await missingPersonService.triggerReunification(selectedPerson.id, status, reunificationNotes)
      setReunificationNotes('')
      showToast(
        status === 'REUNITED' ? 'Case closed — marked as reunited' :
        status === 'IN_PROGRESS' ? 'Reunification initiated — contact SMS sent' :
        'Log note saved'
      )
      await fetchData()
    } catch (e) {
      showToast('Failed to update reunification status', 'error')
    } finally {
      setIsReunifying(false)
    }
  }

  const handleMarkFound = async (personId: string) => {
    try {
      await missingPersonService.updateStatus(personId, 'FOUND')
      showToast('Person marked as found')
      fetchData()
    } catch {
      showToast('Failed to update status', 'error')
    }
  }

  const handleDelete = async (personId: string, name: string) => {
    if (!window.confirm(`Delete record for "${name}"? This cannot be undone.`)) return
    try {
      await missingPersonService.delete(personId)
      showToast('Record deleted')
      if (selectedPerson?.id === personId) setSelectedPerson(null)
      fetchData()
    } catch {
      showToast('Failed to delete record', 'error')
    }
  }

  const displayedPersons = activeTab === 'unidentified'
    ? persons.filter(p => p.isUnidentified)
    : persons.filter(p => !p.isUnidentified)

  const statusBadge = (status: string) =>
    status === 'FOUND'
      ? 'bg-green-500/15 text-green-400'
      : 'bg-red-500/15 text-red-400'

  const reunifyBadge = (s: string) =>
    s === 'NONE' ? 'bg-white/10 text-slate-300' :
    s === 'IN_PROGRESS' ? 'bg-blue-500/15 text-blue-400' :
    'bg-green-500/15 text-green-400'

  return (
    <>
      <PageMeta title="Missing Persons | Suraksha" description="Suraksha Missing Persons Page" />
      <PageBreadcrumb pageTitle="Missing Persons" />
      <div className="space-y-8 animate-in fade-in duration-700 pb-10 w-full min-w-0">

        <div className="flex justify-end mb-2">
          <button
            onClick={() => { setShowModal(true); setSelectedImage(null); setIsUnidentified(false) }}
            className="flex items-center gap-2 px-8 py-4 bg-[#E11D48] text-white rounded-2xl font-bold shadow-xl shadow-red-500/25 hover:scale-[1.02] transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            {t('missing_persons_page.file_new_report')}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 bg-slate-100 dark:bg-[#131f33] p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-cyan-400/10">
          <button onClick={() => setActiveTab('active')} className={cn("flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all", activeTab === 'active' ? "bg-red-500/80 text-white" : "text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-200")}>
            <Users className="w-4 h-4" /> {t('missing_persons_page.tabs.active_cases')}
          </button>
          {!isCitizen && (
            <button onClick={() => setActiveTab('unidentified')} className={cn("flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all", activeTab === 'unidentified' ? "bg-red-500/80 text-white" : "text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-200")}>
              <ShieldAlert className="w-4 h-4" /> {t('missing_persons_page.tabs.unidentified')}
            </button>
          )}
          {!isCitizen && (
            <button onClick={() => { setActiveTab('cross-reference'); handleCrossReference() }} className={cn("flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all", activeTab === 'cross-reference' ? "bg-blue-500/80 text-white" : "text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-200")}>
              <Activity className="w-4 h-4" /> {t('missing_persons_page.tabs.cross_reference')}
            </button>
          )}
          <button onClick={() => { setActiveTab('ai'); setAiMatches([]); setSelectedImage(null) }} className={cn("flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all", activeTab === 'ai' ? "bg-purple-500/80 text-white" : "text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-200")}>
            <BrainCircuit className="w-4 h-4" /> {isCitizen ? 'Search by Photo' : t('missing_persons_page.tabs.ai_matcher')}
          </button>
        </div>

        {/* ACTIVE & UNIDENTIFIED */}
        {(activeTab === 'active' || activeTab === 'unidentified') && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loading ? (
              <div className="col-span-full h-64 flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-red-400" />
              </div>
            ) : displayedPersons.length === 0 ? (
              <div className="col-span-full bg-slate-50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/15 rounded-[2.5rem] p-20 text-center space-y-4">
                <UserSearch className="w-16 h-16 text-slate-400 dark:text-slate-600 mx-auto" />
                <h3 className="text-xl font-bold text-slate-500 dark:text-white/60">{t('missing_persons_page.no_records')}</h3>
                <p className="text-slate-500 text-sm">{t('missing_persons_page.file_report_hint')}</p>
              </div>
            ) : (
              displayedPersons.map((person) => (
                <div key={person.id} className="group suraksha-card rounded-[2rem] overflow-hidden hover:shadow-2xl hover:shadow-red-500/5 transition-all">
                  {/* Photo */}
                  <div className="relative h-56 bg-slate-100 dark:bg-white/5 flex items-center justify-center overflow-hidden">
                    {person.photo ? (
                      <img src={person.photo} alt={person.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <User className="w-20 h-20 text-slate-600" />
                    )}
                    {person.status === 'FOUND' && (
                      <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">{t('missing_persons_page.found_badge')}</div>
                    )}
                    {person.reunificationStatus === 'IN_PROGRESS' && (
                      <div className="absolute top-3 left-3 bg-blue-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">{t('missing_persons_page.reunifying_badge')}</div>
                    )}
                  </div>

                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="text-base font-black text-slate-800 dark:text-white/90">{person.name}</h3>
                      <p className="text-xs font-bold text-slate-500">{person.age ? `${person.age} yrs` : t('missing_persons_page.age_unknown')} &bull; {person.gender || t('missing_persons_page.other_unknown')}</p>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                      <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                      <span className="truncate">{person.lastSeen}</span>
                    </div>
                    <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
                      <button onClick={() => setSelectedPerson(person)} className="text-xs font-black text-red-400 uppercase hover:text-red-300 transition-colors">
                        {t('missing_persons_page.view_file')}
                      </button>
                      {!isCitizen && (
                        <div className="flex items-center gap-2">
                          {person.status === 'MISSING' && (
                            <button
                              onClick={() => handleMarkFound(person.id)}
                              title={t('missing_persons_page.mark_as_found')}
                              className="w-7 h-7 flex items-center justify-center rounded-full bg-green-500/15 text-green-400 hover:bg-green-500/30 transition-colors"
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(person.id, person.name)}
                            title={t('missing_persons_page.delete_record')}
                            className="w-7 h-7 flex items-center justify-center rounded-full bg-white/8 text-slate-500 hover:bg-red-500/15 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* CROSS REFERENCE */}
        {activeTab === 'cross-reference' && (
          <div className="suraksha-card p-8 rounded-[2rem]">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white/90">{t('missing_persons_page.cross_ref_title')}</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t('missing_persons_page.cross_ref_desc')}</p>
              </div>
              <button onClick={handleCrossReference} disabled={crossRefLoading} className="bg-blue-500/20 border border-blue-500/30 text-blue-300 hover:bg-blue-500/30 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50">
                <Activity className="w-5 h-5" /> {crossRefLoading ? t('missing_persons_page.scanning') : t('missing_persons_page.run_scan')}
              </button>
            </div>

            {crossRefLoading ? (
              <div className="py-20 flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">{t('missing_persons_page.cross_referencing')}</span>
              </div>
            ) : crossRefMatches.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
                <p className="text-slate-500 dark:text-slate-400 font-bold">{t('missing_persons_page.no_matches')}</p>
                <p className="text-slate-500 text-sm mt-1">{t('missing_persons_page.run_scan_hint')}</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {crossRefMatches.map((match, i) => (
                  <div key={i} className="flex flex-col md:flex-row gap-6 p-6 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl items-center">
                    <div className="flex-1 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl">
                      <div className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">{t('missing_persons_page.missing_person')}</div>
                      <div className="font-black text-slate-800 dark:text-white/90 text-lg">{match.missingPerson.name}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{match.missingPerson.age} yrs &bull; {match.missingPerson.gender}</div>
                    </div>
                    <div className="w-full md:w-28 text-center shrink-0">
                      <div className="text-3xl font-black text-blue-400">{match.matchScore}%</div>
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('missing_persons_page.match')}</div>
                    </div>
                    <div className="flex-1 bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl">
                      <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">{t('missing_persons_page.found_in')} {match.matchedRecord.type.replace('_', ' ')}</div>
                      <div className="font-black text-slate-800 dark:text-white/90 text-lg">{match.matchedRecord.data.name}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{match.matchedRecord.data.age} yrs &bull; {match.matchedRecord.data.gender}</div>
                    </div>
                    <button onClick={() => setSelectedPerson(match.missingPerson)} className="bg-brand-500 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-cyan-500/20 transition-all shrink-0">
                      {t('missing_persons_page.review')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI FACE MATCHER */}
        {activeTab === 'ai' && (
          <div className="flex flex-col md:flex-row gap-8 suraksha-card p-8 rounded-[2rem]">
            {/* Upload panel */}
            <div className="w-full md:w-1/3 bg-purple-500/10 border border-purple-500/20 p-8 rounded-3xl text-center flex flex-col items-center">
              <BrainCircuit className="w-12 h-12 text-purple-400 mb-4" />
              <h3 className="text-xl font-black text-white/90 mb-2">{t('missing_persons_page.ai_scanner_title')}</h3>
              <p className="text-sm text-slate-400 mb-8">{t('missing_persons_page.ai_scanner_desc')}</p>

              <div className="relative w-full aspect-square bg-white/5 rounded-2xl overflow-hidden flex flex-col items-center justify-center border-2 border-dashed border-purple-500/30 hover:border-purple-400/60 transition-colors cursor-pointer group mb-6">
                {selectedImage ? (
                  <img src={selectedImage} className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Plus className="w-8 h-8 text-purple-500 group-hover:text-purple-400 mb-2" />
                    <span className="font-bold text-purple-500 text-sm">{t('missing_persons_page.select_image')}</span>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>

              <button
                onClick={handleAiSearch}
                disabled={aiLoading || !selectedImage}
                className="w-full bg-purple-500/80 hover:bg-purple-500 text-white py-4 rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
              >
                {aiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5" />}
                {t('missing_persons_page.run_ai_scan')}
              </button>
            </div>

            {/* Results */}
            <div className="flex-1">
              <h3 className="text-xl font-black text-slate-800 dark:text-white/90 mb-6">{t('missing_persons_page.potential_matches')}</h3>
              {aiLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-purple-400 gap-4">
                  <Loader2 className="w-10 h-10 animate-spin" />
                  <span className="text-xs font-bold uppercase tracking-widest animate-pulse">{t('missing_persons_page.neural_analysis')}</span>
                </div>
              ) : aiMatches.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {aiMatches.map((match, i) => (
                    <div
                      key={i}
                      className="flex gap-4 p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/8 cursor-pointer transition-all"
                      onClick={() => setSelectedPerson(match.person)}
                    >
                      <div className="w-20 h-20 bg-slate-100 dark:bg-white/8 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                        {match.person.photo
                          ? <img src={match.person.photo} className="w-full h-full object-cover" />
                          : <User className="w-8 h-8 text-slate-500" />
                        }
                      </div>
                      <div>
                        <div className="font-black text-slate-800 dark:text-white/90">{match.person.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{match.person.age} yrs &bull; {match.person.gender}</div>
                        <div className="mt-2 inline-flex items-center gap-1 bg-green-500/15 text-green-400 px-2 py-1 rounded font-bold text-[10px]">
                          <CheckCircle2 className="w-3 h-3" /> {(match.confidence * 100).toFixed(1)}% Match
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center bg-slate-50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
                  <BrainCircuit className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400 font-bold">{t('missing_persons_page.upload_run_hint')}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CREATE MODAL */}
        {showModal && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-[#131f33] border border-slate-200 dark:border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
              <div className="px-10 py-7 border-b-2 border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-100 dark:bg-[#0e1d36] shrink-0 rounded-t-[2.5rem]">
                <h2 className="text-2xl font-black text-slate-800 dark:text-white/90">{t('missing_persons_page.modal_title')}</h2>
                <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/8 text-slate-400 hover:bg-white/15 transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-10 space-y-6">
                {/* Unidentified toggle — staff only */}
                {!isCitizen && (
                  <div className={cn("p-4 rounded-xl border cursor-pointer transition-all", isUnidentified ? "bg-red-500/15 border-red-500/30" : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10")}>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isUnidentified}
                        onChange={e => setIsUnidentified(e.target.checked)}
                        className="w-5 h-5 rounded accent-red-500"
                      />
                      <span className={cn("font-bold", isUnidentified ? "text-red-300" : "text-slate-600 dark:text-slate-300")}>
                        {t('missing_persons_page.register_unidentified')}
                      </span>
                    </label>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{t('missing_persons_page.name_alias')}</label>
                    <input name="name" type="text" required className="suraksha-input w-full" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{t('missing_persons_page.age')}</label>
                    <input name="age" type="number" min="0" max="120" className="suraksha-input w-full" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{t('missing_persons_page.gender')}</label>
                    <select name="gender" className="suraksha-input w-full">
                      <option value="Male">{t('missing_persons_page.male')}</option>
                      <option value="Female">{t('missing_persons_page.female')}</option>
                      <option value="Other">{t('missing_persons_page.other_unknown')}</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{isUnidentified ? t('missing_persons_page.found_location') : t('missing_persons_page.last_seen_location')}</label>
                    <input name="lastSeen" type="text" required className="suraksha-input w-full" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{t('missing_persons_page.description_label')}</label>
                  <textarea name="description" rows={3} required className="suraksha-input w-full resize-none" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{t('missing_persons_page.photo')}</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-xl border-2 border-dashed border-slate-300 dark:border-white/20 flex items-center justify-center overflow-hidden relative hover:border-slate-400 dark:hover:border-white/40 transition-colors cursor-pointer">
                      {selectedImage ? <img src={selectedImage} className="w-full h-full object-cover" /> : <Plus className="text-slate-500" />}
                      <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                    <span className="text-xs text-slate-400 font-bold">{selectedImage ? t('missing_persons_page.photo_selected') : t('missing_persons_page.upload_photo_hint')}</span>
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-white/10 pt-6 space-y-4">
                  <h4 className="font-bold text-slate-700 dark:text-white/80">{t('missing_persons_page.family_contact_section')}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{t('missing_persons_page.contact_name')}</label>
                      <input name="contactName" type="text" className="suraksha-input w-full" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{t('missing_persons_page.contact_phone')}</label>
                      <input name="contactPhone" type="tel" className="suraksha-input w-full" />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-5 bg-[#E11D48] text-white rounded-2xl font-bold shadow-xl shadow-red-500/25 hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                >
                  {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Plus className="w-5 h-5" />}
                  {t('missing_persons_page.save_record')}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* DETAIL & REUNIFICATION MODAL */}
        {selectedPerson && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-900/70 backdrop-blur-xl p-4 animate-in fade-in duration-500">
            <div className="bg-white dark:bg-[#131f33] border border-slate-200 dark:border-white/10 w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col md:flex-row h-[90vh] max-h-[90vh]">

              {/* Left: Photo + Info */}
              <div className="md:w-1/3 bg-slate-50 dark:bg-[#0e1d36] border-b md:border-b-0 md:border-r border-slate-200 dark:border-white/10 flex flex-col">
                <div className="h-56 shrink-0 relative">
                  {selectedPerson.photo ? (
                    <img src={selectedPerson.photo} alt={selectedPerson.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-white/5">
                      <User className="w-20 h-20 text-slate-400 dark:text-slate-600" />
                    </div>
                  )}
                </div>

                <div className="p-6 flex-1 overflow-y-auto space-y-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white/90 leading-tight">{selectedPerson.name}</h2>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">
                      {selectedPerson.age ? `${selectedPerson.age} yrs` : t('missing_persons_page.unknown_age')} &bull; {selectedPerson.gender || t('missing_persons_page.other_unknown')}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">{t('missing_persons_page.status')}</span>
                    <span className={cn("px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider inline-block", statusBadge(selectedPerson.status))}>
                      {selectedPerson.status}
                    </span>
                  </div>

                  {selectedPerson.contactName && (
                    <div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">{t('missing_persons_page.family_contact')}</span>
                      <p className="text-sm font-bold text-slate-700 dark:text-white/80">{selectedPerson.contactName}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-300">{selectedPerson.contactPhone || t('missing_persons_page.no_phone')}</p>
                    </div>
                  )}

                  {!isCitizen && selectedPerson.status === 'MISSING' && (
                    <button
                      onClick={() => handleMarkFound(selectedPerson.id)}
                      className="w-full bg-green-500/15 hover:bg-green-500/25 text-green-400 border border-green-500/30 text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCheck className="w-4 h-4" /> {t('missing_persons_page.mark_as_found')}
                    </button>
                  )}

                  {!isCitizen && (
                    <button
                      onClick={() => handleDelete(selectedPerson.id, selectedPerson.name)}
                      className="w-full bg-white/5 hover:bg-red-500/15 text-slate-400 hover:text-red-400 border border-white/10 hover:border-red-500/30 text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> {t('missing_persons_page.delete_record')}
                    </button>
                  )}
                </div>
              </div>

              {/* Right: Case Details + Reunification */}
              <div className="flex-1 p-8 md:p-10 overflow-y-auto relative">
                <button
                  onClick={() => setSelectedPerson(null)}
                  className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/8 text-slate-400 hover:bg-white/15 transition-all z-10"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="space-y-8 pb-10">
                  {/* Case Details */}
                  <div>
                    <h3 className="text-lg font-black text-slate-800 dark:text-white/90 mb-4 border-b border-slate-200 dark:border-white/10 pb-2">{t('missing_persons_page.case_details')}</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">{t('missing_persons_page.last_seen')}</span>
                        <span className="font-bold text-slate-700 dark:text-white/80 mt-1 block">{selectedPerson.lastSeen}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">{t('missing_persons_page.reported')}</span>
                        <span className="font-bold text-slate-700 dark:text-white/80 mt-1 block">{new Date(selectedPerson.createdAt).toLocaleDateString()}</span>
                      </div>
                      {selectedPerson.description && (
                        <div className="col-span-2 bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">{t('missing_persons_page.description')}</span>
                          <span className="text-slate-600 dark:text-slate-300 text-sm">{selectedPerson.description}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reunification Workflow — staff only */}
                  {!isCitizen && <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
                    <h3 className="text-lg font-black text-blue-300 mb-1 flex items-center gap-2">
                      <Phone className="w-5 h-5" /> {t('missing_persons_page.reunification_title')}
                    </h3>
                    <p className="text-sm text-blue-400/70 mb-6">{t('missing_persons_page.reunification_desc')}</p>

                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-500 shrink-0">{t('missing_persons_page.current_state')}</span>
                        <span className={cn("px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider", reunifyBadge(selectedPerson.reunificationStatus))}>
                          {selectedPerson.reunificationStatus?.replace('_', ' ')}
                        </span>
                      </div>

                      <textarea
                        value={reunificationNotes}
                        onChange={e => setReunificationNotes(e.target.value)}
                        placeholder={t('missing_persons_page.reunification_log_placeholder')}
                        rows={2}
                        className="suraksha-input w-full resize-none"
                      />

                      <div className="flex flex-wrap gap-2">
                        {selectedPerson.reunificationStatus !== 'IN_PROGRESS' && selectedPerson.reunificationStatus !== 'REUNITED' && (
                          <button
                            onClick={() => handleReunify('IN_PROGRESS')}
                            disabled={isReunifying}
                            className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {isReunifying ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                            {t('missing_persons_page.initiate_reunification')}
                          </button>
                        )}
                        {selectedPerson.reunificationStatus === 'IN_PROGRESS' && (
                          <button
                            onClick={() => handleReunify('REUNITED')}
                            disabled={isReunifying}
                            className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-300 px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {isReunifying ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            {t('missing_persons_page.mark_reunited')}
                          </button>
                        )}
                        <button
                          onClick={() => handleReunify(selectedPerson.reunificationStatus)}
                          disabled={!reunificationNotes || isReunifying}
                          className="bg-white/8 hover:bg-white/15 text-slate-300 border border-white/10 px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                        >
                          {t('missing_persons_page.save_log_note')}
                        </button>
                      </div>

                      {selectedPerson.reunificationNotes && (
                        <div className="mt-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-xl text-xs text-slate-500 dark:text-slate-400 whitespace-pre-wrap max-h-40 overflow-y-auto font-mono">
                          {selectedPerson.reunificationNotes}
                        </div>
                      )}
                    </div>
                  </div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className={cn(
            "fixed bottom-8 right-8 z-[9999999] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-8 duration-300 font-sans",
            toast.type === 'success' ? "bg-white dark:bg-[#131f33] text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-lg" :
            toast.type === 'error' ? "bg-white dark:bg-[#131f33] text-red-600 dark:text-red-400 border border-red-500/30 shadow-lg" :
            "bg-white dark:bg-[#131f33] text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-lg"
          )}>
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            <span className="font-bold text-sm tracking-wide">{toast.message}</span>
          </div>
        )}
      </div>
    </>
  )
}
