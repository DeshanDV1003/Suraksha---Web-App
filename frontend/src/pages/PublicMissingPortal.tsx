import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, MapPin, Send, Loader2, CheckCircle2, UserSearch, Phone } from 'lucide-react'
import { missingPersonService } from '@/services/api'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

const INITIAL_FORM = {
  name: '',
  description: '',
  lastSeen: '',
  age: '',
  gender: '',
  contactName: '',
  contactPhone: ''
}

export default function PublicMissingPortal() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [submittedId, setSubmittedId] = useState('')
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('search')

  const [searchQuery, setSearchQuery] = useState('')
  const [allPersons, setAllPersons] = useState<any[]>([])
  const [formData, setFormData] = useState(INITIAL_FORM)

  const set = (field: string, value: any) => setFormData(prev => ({ ...prev, [field]: value }))

  useEffect(() => {
    if (activeTab === 'search') fetchMissing()
  }, [activeTab])

  const fetchMissing = async () => {
    setLoading(true)
    try {
      const res = await missingPersonService.publicGetMissing()
      setAllPersons(res.data)
    } catch {
      // silently fail — list just stays empty
    } finally {
      setLoading(false)
    }
  }

  const filteredPersons = allPersons.filter(p => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.lastSeen || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
    )
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await missingPersonService.publicReportMissing({
        ...formData,
        age: parseInt(formData.age) || null
      })
      setSubmittedId(res.data?.id || '')
      setSuccess(true)
    } catch {
      setError(t('public_missing_portal.submit_failed'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleReturnToSearch = () => {
    setSuccess(false)
    setSubmittedId('')
    setFormData(INITIAL_FORM)
    setActiveTab('search')
    fetchMissing()
  }

  const inputClass = "w-full bg-[#0a1628] border border-white/10 text-white/90 placeholder-slate-600 p-4 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/40 outline-none transition-all"
  const labelClass = "block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2"

  if (success) {
    return (
      <div className="min-h-screen bg-[#0e1d36] flex items-center justify-center p-4">
        <div className="bg-[#131f33] border border-white/10 p-10 rounded-[2rem] shadow-2xl max-w-md w-full text-center">
          <div className="w-20 h-20 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-black text-white/90 mb-2">{t('public_missing_portal.report_submitted')}</h2>
          <p className="text-slate-400 mb-6 text-sm leading-relaxed">
            {t('public_missing_portal.report_logged')}
          </p>
          {submittedId && (
            <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 mb-6">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{t('public_missing_portal.reference_number')}</p>
              <p className="font-mono font-black text-cyan-400 text-sm break-all">{submittedId}</p>
              <p className="text-[10px] text-slate-500 mt-1">{t('public_missing_portal.keep_reference')}</p>
            </div>
          )}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-5 py-3 mb-6 flex items-center gap-3 text-left">
            <Phone className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <p className="text-xs font-black text-amber-300">{t('public_missing_portal.emergency_hotline')}</p>
              <p className="text-sm font-black text-amber-400">1919</p>
            </div>
          </div>
          <button
            onClick={handleReturnToSearch}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-500 transition-all"
          >
            {t('public_missing_portal.return_to_search')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0e1d36] p-4 sm:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto">
            <UserSearch className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-white/90">{t('public_missing_portal.portal_title')}</h1>
          <p className="text-slate-400 max-w-lg mx-auto text-sm leading-relaxed">
            {t('public_missing_portal.portal_desc')}
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#131f33] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden">

          {/* Tab nav */}
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab('search')}
              className={cn(
                'flex-1 py-4 font-bold text-sm text-center transition-all',
                activeTab === 'search'
                  ? 'bg-blue-500/15 text-blue-300 border-b-2 border-blue-500'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              )}
            >
              {t('public_missing_portal.search_database')}
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={cn(
                'flex-1 py-4 font-bold text-sm text-center transition-all',
                activeTab === 'report'
                  ? 'bg-blue-500/15 text-blue-300 border-b-2 border-blue-500'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              )}
            >
              {t('public_missing_portal.report_missing')}
            </button>
          </div>

          <div className="p-6 sm:p-10">

            {/* SEARCH TAB */}
            {activeTab === 'search' && (
              <div className="space-y-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    placeholder={t('public_missing_portal.search_placeholder')}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className={inputClass + ' pl-12'}
                  />
                </div>

                {loading ? (
                  <div className="py-20 flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredPersons.length === 0 ? (
                      <div className="col-span-2 py-16 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                        <UserSearch className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-500 font-bold">
                          {searchQuery ? t('public_missing_portal.no_matching', { query: searchQuery }) : t('public_missing_portal.no_records')}
                        </p>
                      </div>
                    ) : (
                      filteredPersons.map(person => (
                        <div key={person.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/8 hover:border-white/20 transition-all">
                          <div className="flex justify-between items-start mb-3 gap-2">
                            <h3 className="font-black text-base text-white/90 leading-tight">
                              {person.name}{person.isUnidentified && <span className="text-slate-500 font-medium"> {t('public_missing_portal.unidentified')}</span>}
                            </h3>
                            <span className={cn(
                              'px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0 border',
                              person.status === 'FOUND'
                                ? 'bg-green-500/15 text-green-400 border-green-500/30'
                                : person.status === 'DECEASED'
                                ? 'bg-slate-500/15 text-slate-400 border-slate-500/30'
                                : 'bg-red-500/15 text-red-400 border-red-500/30'
                            )}>
                              {person.status}
                            </span>
                          </div>
                          <div className="space-y-1.5 text-sm">
                            {person.age && (
                              <p className="text-slate-300">
                                <span className="font-bold text-slate-500">{t('public_missing_portal.age_label')}</span> {person.age}
                                {person.gender && <span className="text-slate-500 ml-2">&bull; {person.gender}</span>}
                              </p>
                            )}
                            <p className="flex gap-2 items-start text-slate-300">
                              <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                              <span><span className="font-bold text-slate-500">{t('public_missing_portal.last_seen_label')}</span> {person.lastSeen}</span>
                            </p>
                            <p className="text-slate-400 line-clamp-2 mt-1">{person.description}</p>
                          </div>
                          <div className="mt-4 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                            {t('public_missing_portal.reported_ago', { time: formatDistanceToNow(new Date(person.createdAt)) })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                <p className="text-center text-xs text-slate-600 font-bold pt-2">
                  {t('public_missing_portal.showing_records', { count: filteredPersons.length, total: allPersons.length })} &bull; {t('public_missing_portal.last_updated')}
                </p>
              </div>
            )}

            {/* REPORT TAB */}
            {activeTab === 'report' && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-500/10 text-red-400 p-4 rounded-xl text-sm font-bold border border-red-500/20">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>{t('public_missing_portal.full_name')}</label>
                    <input type="text" required className={inputClass}
                      value={formData.name} onChange={e => set('name', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>{t('public_missing_portal.age')}</label>
                      <input type="number" min="0" max="120" className={inputClass}
                        value={formData.age} onChange={e => set('age', e.target.value)} />
                    </div>
                    <div>
                      <label className={labelClass}>{t('public_missing_portal.gender')}</label>
                      <select className={inputClass + ' cursor-pointer'}
                        value={formData.gender} onChange={e => set('gender', e.target.value)}>
                        <option value="">{t('public_missing_portal.unknown')}</option>
                        <option value="Male">{t('public_missing_portal.male')}</option>
                        <option value="Female">{t('public_missing_portal.female')}</option>
                        <option value="Other">{t('public_missing_portal.other')}</option>
                      </select>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>{t('public_missing_portal.last_seen_location')}</label>
                    <input type="text" required
                      placeholder={t('public_missing_portal.last_seen_placeholder')}
                      className={inputClass}
                      value={formData.lastSeen} onChange={e => set('lastSeen', e.target.value)} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>{t('public_missing_portal.description_label')}</label>
                    <textarea required rows={3} className={inputClass + ' resize-none'}
                      value={formData.description} onChange={e => set('description', e.target.value)} />
                  </div>
                </div>

                <div className="border-t border-white/10 pt-6 space-y-5">
                  <h4 className="font-bold text-white/80">{t('public_missing_portal.contact_section')}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className={labelClass}>{t('public_missing_portal.your_name')}</label>
                      <input type="text" required className={inputClass}
                        value={formData.contactName} onChange={e => set('contactName', e.target.value)} />
                    </div>
                    <div>
                      <label className={labelClass}>{t('public_missing_portal.contact_phone')}</label>
                      <input type="tel" required className={inputClass}
                        value={formData.contactPhone} onChange={e => set('contactPhone', e.target.value)} />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 text-white font-bold text-lg py-4 rounded-xl hover:bg-blue-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                  {t('public_missing_portal.submit_report')}
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 pb-4">
          Suraksha Disaster Management System &bull; Emergency Hotline: <span className="text-amber-500 font-black">1919</span>
        </p>
      </div>
    </div>
  )
}
