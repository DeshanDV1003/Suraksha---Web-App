import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDialog } from '@/components/ui/dialogs/DialogProvider'
import { Home, Plus, X, CheckCircle2, Loader2, Camera, TrendingUp, ChevronDown, Sparkles, MapPin, ShieldCheck, Map, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { damageAssessmentService, incidentService } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";

const pickerIcon = L.divIcon({
  className: '',
  html: `<div style="width:28px;height:28px;background:#06b6d4;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 12px rgba(0,0,0,0.4)"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
})

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: e => onPick(e.latlng.lat, e.latlng.lng) })
  return null
}

export default function DamageAssessmentPage() {
  const { alert } = useDialog()
  const { t } = useTranslation()
  const { user } = useAuth()
  const isCitizen = (user as any)?.role === 'CITIZEN'
  const [assessments, setAssessments] = useState<any[]>([])
  const [incidents, setIncidents] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null)

  const [activeTab, setActiveTab] = useState('verification')
  const [showMapPicker, setShowMapPicker] = useState(false)
  const [pickedLatLng, setPickedLatLng] = useState<{ lat: number; lng: number } | null>(null)
  const [geocoding, setGeocoding] = useState(false)

  // AI state
  const [aiLoading, setAiLoading] = useState(false)
  const [aiData, setAiData] = useState<any>(null)

  // Controlled form state for fields that need AI override
  const [formState, setFormState] = useState({
    incidentId: '',
    location: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    category: 'RESIDENTIAL',
    structuralDamage: 'MINOR',
    cropDamage: 'NONE',
    affectedPersons: 1,
    estimatedLoss: '',
    propertyOwnershipStatus: 'Owned',
    familyVulnerabilityScore: 5,
    incomeBracket: '< 50,000 LKR',
    notes: '',
  })

  const showToast = (message: string, type: 'success'|'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const [assessRes, incRes, repRes] = await Promise.all([
        damageAssessmentService.getAssessments(),
        incidentService.getIncidents(),
        damageAssessmentService.getDistrictSummaryReport()
      ])
      setAssessments(assessRes.data)
      setIncidents(incRes.data)
      setReports(repRes.data)
    } catch (error) {
      console.error('Failed to fetch assessment data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const simulateAiUpload = async () => {
    setAiLoading(true)
    try {
      const res = await damageAssessmentService.aiClassifyImage('mock_image_url')
      setAiData(res.data)
      // Override form fields with AI result
      setFormState(prev => ({
        ...prev,
        structuralDamage: res.data.severity || prev.structuralDamage,
        estimatedLoss: String(res.data.estimatedCost || prev.estimatedLoss),
      }))
    } catch (e) {
      console.error(e)
      showToast(t('damage_assessment_page.ai_classification_failed', 'AI classification failed'), 'error')
    } finally {
      setAiLoading(false)
    }
  }

  const handleOpenModal = () => {
    setFormState({
      incidentId: '', location: '', latitude: undefined, longitude: undefined,
      category: 'RESIDENTIAL', structuralDamage: 'MINOR', cropDamage: 'NONE',
      affectedPersons: 1, estimatedLoss: '', propertyOwnershipStatus: 'Owned',
      familyVulnerabilityScore: 5, incomeBracket: '< 50,000 LKR', notes: '',
    })
    setAiData(null)
    setPickedLatLng(null)
    setShowMapPicker(false)
    setShowModal(true)
  }

  const handleMapPick = async (lat: number, lng: number) => {
    setPickedLatLng({ lat, lng })
    setFormState(p => ({ ...p, latitude: lat, longitude: lng }))
    setGeocoding(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data = await res.json()
      const addr = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
      setFormState(p => ({ ...p, location: addr }))
    } catch {
      setFormState(p => ({ ...p, location: `${lat.toFixed(5)}, ${lng.toFixed(5)}` }))
    } finally {
      setGeocoding(false)
      setShowMapPicker(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      ...formState,
      affectedPersons: Number(formState.affectedPersons),
      familyVulnerabilityScore: Number(formState.familyVulnerabilityScore),
      estimatedLoss: formState.estimatedLoss ? parseFloat(formState.estimatedLoss) : undefined,
      incidentId: formState.incidentId || undefined,
      aiEstimatedDamage: aiData?.severity,
      aiEstimatedCost: aiData?.estimatedCost,
      mediaUrls: ['mock_uploaded_photo'],
    }

    try {
      setIsSubmitting(true)
      await damageAssessmentService.reportDamage(data)
      setShowModal(false)
      showToast(t('damage_assessment_page.assessment_submitted_successfully', 'Assessment submitted successfully'))
      fetchData()
    } catch (error) {
      console.error('Failed to report damage:', error)
      showToast(t('damage_assessment_page.failed_to_submit_assessment', 'Failed to submit assessment'), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateWorkflow = async (id: string, status: string) => {
    try {
      await damageAssessmentService.updateWorkflowStatus(id, status)
      showToast(status === 'APPROVED' ? t('damage_assessment_page.assessment_approved', 'Assessment approved') : status === 'REJECTED' ? t('damage_assessment_page.assessment_rejected', 'Assessment rejected') : t('damage_assessment_page.escalated_to_senior_review', 'Escalated to senior review'))
      fetchData()
    } catch {
      showToast(t('damage_assessment_page.failed_to_update_status', 'Failed to update status'), 'error')
    }
  }

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'TOTAL_LOSS':
      case 'DESTROYED': return 'text-red-400 bg-red-500/15'
      case 'MAJOR': return 'text-orange-400 bg-orange-500/15'
      case 'MODERATE': return 'text-yellow-400 bg-yellow-500/15'
      case 'MINOR': return 'text-blue-400 bg-blue-500/15'
      default: return 'text-slate-400 bg-white/8'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-500/15 text-green-400'
      case 'SENIOR_REVIEW': return 'bg-purple-500/15 text-purple-400'
      case 'REJECTED': return 'bg-red-500/15 text-red-400'
      default: return 'bg-orange-500/15 text-orange-400'
    }
  }

  // Citizens only see their own submissions; admins/staff see all
  const displayedAssessments = isCitizen
    ? assessments.filter(a => a.reportedById === (user as any)?.id)
    : assessments

  const inputClass = "suraksha-input w-full"
  const selectClass = "suraksha-input w-full appearance-none cursor-pointer pr-10"

  return (
    <>
      <PageMeta title="Damage Assessment | Suraksha" description="Suraksha Damage Assessment Page" />
      <PageBreadcrumb pageTitle={t('damage_assessment_page.pageTitle', 'Damage Assessment')} />
      <div className="space-y-8 animate-in fade-in duration-700 pb-10">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div />
          <button
            onClick={handleOpenModal}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-brand-500 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/25 hover:scale-[1.02] transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            {t('damage_assessment_page.new_field_report')}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-slate-100 dark:bg-[#131f33] p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-cyan-400/10">
          {[
            { id: 'verification', label: isCitizen ? 'My Reports' : t('damage_assessment_page.tabs.verification'), icon: ShieldCheck },
            ...(!isCitizen ? [{ id: 'reports', label: t('damage_assessment_page.tabs.district_reports'), icon: Map }] : []),
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all",
                activeTab === tab.id
                  ? "bg-brand-500 text-white shadow-md shadow-cyan-500/20"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-200"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* VERIFICATION WORKFLOW */}
        {activeTab === 'verification' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
                </div>
              ) : displayedAssessments.length === 0 ? (
                <div className="bg-slate-50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/15 rounded-[2.5rem] p-20 text-center space-y-4">
                  <Home className="w-16 h-16 text-slate-400 dark:text-slate-600 mx-auto" />
                  <h3 className="text-xl font-bold text-slate-600 dark:text-white/70">{isCitizen ? 'No reports submitted yet' : t('damage_assessment_page.no_assessments')}</h3>
                  <p className="text-slate-500 max-w-xs mx-auto">{isCitizen ? 'Use the button above to submit your first damage report.' : t('damage_assessment_page.no_assessments_desc')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {displayedAssessments.map((item) => (
                    <div key={item.id} className="suraksha-card rounded-[2rem] p-8 hover:shadow-2xl hover:shadow-blue-500/5 transition-all">
                      <div className="flex flex-col gap-6">
                        {/* Header */}
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em]">{item.category}</span>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white/90 mt-1 flex items-center gap-2">
                              {item.location}
                              {item.aiEstimatedDamage && (
                                <span title="AI Verified" className="bg-purple-500/15 text-purple-400 p-1 rounded-full">
                                  <Sparkles className="w-3 h-3" />
                                </span>
                              )}
                            </h3>
                            {item.incident && (
                              <p className="text-xs text-slate-500 mt-0.5">{t('damage_assessment_page.linked')} {item.incident.title}</p>
                            )}
                          </div>
                          <div className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0", getStatusBadge(item.status))}>
                            {item.status.replace('_', ' ')}
                          </div>
                        </div>

                        {/* Stats grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-white/5 p-4 rounded-2xl">
                          <div className="space-y-1">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('damage_assessment_page.damage')}</div>
                            <div className={cn("text-[10px] font-black px-2 py-1 rounded-lg inline-block", getLevelBadge(item.structuralDamage))}>
                              {item.structuralDamage?.replace('_', ' ')}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('damage_assessment_page.est_loss')}</div>
                            <div className="text-sm font-black text-slate-700 dark:text-white/80">LKR {item.estimatedLoss?.toLocaleString() || '—'}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('damage_assessment_page.affected')}</div>
                            <div className="text-sm font-black text-slate-700 dark:text-white/80">{item.affectedPersons || 0} {t('damage_assessment_page.persons', 'persons')}</div>
                          </div>
                          <div className="space-y-1 text-right">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('damage_assessment_page.compensation')}</div>
                            <div className="text-sm font-black flex items-center justify-end gap-2">
                              <span className="text-slate-700 dark:text-white/70">{item.compensationEligibilityScore || 0}/100</span>
                              {item.compensationEligible
                                ? <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded font-bold">{t('damage_assessment_page.eligible')}</span>
                                : <span className="text-[10px] bg-red-500/80 text-white px-2 py-0.5 rounded font-bold">{t('damage_assessment_page.ineligible')}</span>
                              }
                            </div>
                          </div>
                        </div>

                        {item.notes && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 italic border-l-2 border-slate-200 dark:border-white/10 pl-3">{item.notes}</p>
                        )}

                        {/* Verification Actions — admin/staff only */}
                        {!isCitizen && item.status !== 'APPROVED' && item.status !== 'REJECTED' && (
                          <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex gap-2 flex-wrap">
                            {item.status === 'PENDING_REVIEW' && (
                              <button
                                onClick={() => updateWorkflow(item.id, 'SENIOR_REVIEW')}
                                className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-bold py-3 rounded-xl transition-colors"
                              >
                                {t('damage_assessment_page.escalate')}
                              </button>
                            )}
                            {item.status === 'SENIOR_REVIEW' && (
                              <button
                                onClick={() => updateWorkflow(item.id, 'APPROVED')}
                                className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30 text-xs font-bold py-3 rounded-xl transition-colors"
                              >
                                {t('damage_assessment_page.approve')}
                              </button>
                            )}
                            <button
                              onClick={() => updateWorkflow(item.id, 'REJECTED')}
                              className="flex-1 bg-white/5 hover:bg-red-500/15 text-slate-400 hover:text-red-400 text-xs font-bold py-3 rounded-xl transition-colors border border-white/10 hover:border-red-500/30"
                            >
                              {t('damage_assessment_page.reject')}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {isCitizen ? (
                <div className="bg-slate-100 dark:bg-[#0a1628] border border-slate-200 dark:border-white/10 rounded-[2rem] p-8 space-y-6 shadow-2xl">
                  <div className="w-12 h-12 bg-cyan-500/15 rounded-2xl flex items-center justify-center">
                    <Home className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white/90">My Reports</h3>
                  <p className="text-sm text-slate-400">Use the button above to submit a new damage report. Our team will review your submission and contact you about compensation eligibility.</p>
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-white/5 rounded-2xl p-4 flex justify-between items-center border border-slate-200 dark:border-transparent">
                      <span className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-widest">Submitted</span>
                      <span className="text-xl font-black text-cyan-400">{displayedAssessments.length}</span>
                    </div>
                    <div className="bg-white dark:bg-white/5 rounded-2xl p-4 flex justify-between items-center border border-slate-200 dark:border-transparent">
                      <span className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-widest">Under Review</span>
                      <span className="text-xl font-black text-orange-400">{displayedAssessments.filter(a => a.status === 'PENDING_REVIEW' || a.status === 'SENIOR_REVIEW').length}</span>
                    </div>
                    <div className="bg-white dark:bg-white/5 rounded-2xl p-4 flex justify-between items-center border border-slate-200 dark:border-transparent">
                      <span className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-widest">Approved</span>
                      <span className="text-xl font-black text-green-400">{displayedAssessments.filter(a => a.status === 'APPROVED').length}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-100 dark:bg-[#0a1628] border border-slate-200 dark:border-white/10 rounded-[2rem] p-8 space-y-6 shadow-2xl">
                  <div className="w-12 h-12 bg-cyan-500/15 rounded-2xl flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white/90">{t('damage_assessment_page.verification_queue')}</h3>
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-white/5 rounded-2xl p-4 flex justify-between items-center border border-slate-200 dark:border-transparent">
                      <span className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-widest">{t('damage_assessment_page.pending_review')}</span>
                      <span className="text-xl font-black text-orange-400">{assessments.filter(a => a.status === 'PENDING_REVIEW').length}</span>
                    </div>
                    <div className="bg-white dark:bg-white/5 rounded-2xl p-4 flex justify-between items-center border border-slate-200 dark:border-transparent">
                      <span className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-widest">{t('damage_assessment_page.senior_review')}</span>
                      <span className="text-xl font-black text-purple-400">{assessments.filter(a => a.status === 'SENIOR_REVIEW').length}</span>
                    </div>
                    <div className="bg-white dark:bg-white/5 rounded-2xl p-4 flex justify-between items-center border border-slate-200 dark:border-transparent">
                      <span className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-widest">{t('damage_assessment_page.approved')}</span>
                      <span className="text-xl font-black text-green-400">{assessments.filter(a => a.status === 'APPROVED').length}</span>
                    </div>
                    <div className="bg-white dark:bg-white/5 rounded-2xl p-4 flex justify-between items-center border border-slate-200 dark:border-transparent">
                      <span className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-widest">{t('damage_assessment_page.total')}</span>
                      <span className="text-xl font-black text-slate-800 dark:text-white/90">{assessments.length}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DISTRICT REPORTS */}
        {activeTab === 'reports' && (
          <div className="suraksha-card p-8 rounded-[2rem]">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white/90 mb-6">{t('damage_assessment_page.district_summary')}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {reports.length === 0 && (
                <p className="text-slate-400 font-medium col-span-full text-center py-10">{t('damage_assessment_page.no_active_reports', 'No active district reports found. Submit assessments with location data to generate reports.')}</p>
              )}
              {reports.map((report, i) => (
                <div key={i} className="bg-slate-50 dark:bg-white/5 p-6 rounded-3xl border border-slate-200 dark:border-white/10">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-black text-slate-800 dark:text-white/90">{report.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5">{report.totalStructures} {t('damage_assessment_page.structures_assessed')}</p>
                    </div>
                    {!isCitizen && (
                      <button
                        onClick={() => alert(`Report for ${report.name} submitted to government portal successfully.`, { variant: 'success', title: 'Submitted' })}
                        className="bg-brand-500 text-white text-xs font-bold px-4 py-2 rounded-lg shadow hover:shadow-cyan-500/20 hover:scale-105 transition-all"
                      >
                        {t('damage_assessment_page.submit_to_govt')}
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between bg-white dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-bold">
                      <span className="text-slate-500 dark:text-slate-400">{t('damage_assessment_page.estimated_total_loss')}</span>
                      <span className="text-red-400">LKR {report.totalEstimatedLoss.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between bg-white dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-bold">
                      <span className="text-slate-500 dark:text-slate-400">{t('damage_assessment_page.affected_persons')}</span>
                      <span className="text-slate-700 dark:text-white/80">{report.affectedPersons}</span>
                    </div>
                    {report.categories && Object.entries(report.categories).map(([cat, count]: any) => (
                      <div key={cat} className="flex justify-between bg-white/5 p-3 rounded-xl border border-white/10 text-sm font-bold">
                        <span className="text-slate-400">{cat}</span>
                        <span className="text-cyan-400">{count} structure{count > 1 ? 's' : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODAL */}
        {showModal && (
          <div className="fixed inset-0 z-[999999] flex justify-center overflow-y-auto bg-slate-900/70 backdrop-blur-md p-4 py-8 sm:py-16 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-[#131f33] border border-slate-200 dark:border-white/10 w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 my-auto flex flex-col md:flex-row">

              {/* Left: AI Panel */}
              <div className="w-full md:w-1/3 bg-slate-50 dark:bg-[#0e1d36] border-b md:border-b-0 md:border-r border-slate-200 dark:border-white/10 p-10 flex flex-col items-center justify-center text-center">
                <Sparkles className="w-12 h-12 text-purple-400 mb-4" />
                <h3 className="text-xl font-black text-slate-800 dark:text-white/90 mb-2">{t('damage_assessment_page.ai_assessor')}</h3>
                <p className="text-xs text-slate-400 mb-8">{t('damage_assessment_page.ai_upload_prompt')}</p>

                {!aiData && !aiLoading && (
                  <button
                    type="button"
                    onClick={simulateAiUpload}
                    className="w-full bg-white/5 border-2 border-dashed border-purple-500/30 text-purple-400 font-bold py-10 rounded-3xl hover:bg-purple-500/10 transition-colors flex flex-col items-center gap-2"
                  >
                    <Camera className="w-8 h-8" />
                    {t('damage_assessment_page.upload_field_photo')}
                  </button>
                )}

                {aiLoading && (
                  <div className="w-full py-12 flex flex-col items-center gap-4 text-purple-400">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span className="text-xs font-bold uppercase tracking-widest animate-pulse">{t('damage_assessment_page.running_ml')}</span>
                  </div>
                )}

                {aiData && (
                  <div className="w-full bg-purple-500/10 border border-purple-500/20 p-6 rounded-3xl text-left space-y-4">
                    <div className="flex items-center gap-2 text-purple-300 font-bold">
                      <CheckCircle2 className="w-5 h-5" /> {t('damage_assessment_page.analysis_complete')}
                    </div>
                    {aiData.source === 'fallback' && (
                      <p className="text-[10px] text-amber-400/80 font-bold">{t('damage_assessment_page.ml_offline')}</p>
                    )}
                    <div>
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('damage_assessment_page.detected_severity')}</div>
                      <div className="text-lg font-black text-slate-800 dark:text-white/90">{aiData.severity}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('damage_assessment_page.est_replacement_cost')}</div>
                      <div className="text-lg font-black text-slate-800 dark:text-white/90">LKR {aiData.estimatedCost?.toLocaleString()}</div>
                    </div>
                    <button type="button" onClick={() => { setAiData(null) }} className="text-xs text-slate-500 hover:text-slate-300 underline">
                      {t('damage_assessment_page.clear_reupload')}
                    </button>
                  </div>
                )}
              </div>

              {/* Right: Form */}
              <div className="w-full md:w-2/3 flex flex-col">
                <div className="px-10 py-7 border-b-2 border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-100 dark:bg-[#0f172a]">
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white/90">{t('damage_assessment_page.field_report_form')}</h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/8 text-slate-400 hover:bg-white/15 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-10 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 overflow-y-auto max-h-[65vh] bg-white dark:bg-transparent">

                  {/* Incident link (optional) */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{t('damage_assessment_page.linked_incident')}</label>
                    <div className="relative">
                      <select
                        className={selectClass}
                        value={formState.incidentId}
                        onChange={e => setFormState(p => ({ ...p, incidentId: e.target.value }))}
                      >
                        <option value="">{t('damage_assessment_page.none_option')}</option>
                        {incidents.map((inc: any) => (
                          <option key={inc.id} value={inc.id}>{inc.title}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>

                  {/* Location */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{t('damage_assessment_page.location_address')}</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text" placeholder="e.g. 42 Main St, Colombo" required
                          className="suraksha-input w-full"
                          value={formState.location}
                          onChange={e => setFormState(p => ({ ...p, location: e.target.value }))}
                        />
                        {geocoding && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-cyan-400" />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowMapPicker(v => !v)}
                        title="Pick from map"
                        className={cn(
                          "px-4 rounded-xl flex items-center justify-center transition-all border",
                          showMapPicker
                            ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-300"
                            : "bg-white/8 border-white/10 text-slate-300 hover:bg-white/15"
                        )}
                      >
                        <MapPin className="w-5 h-5"/>
                      </button>
                    </div>
                    {showMapPicker && (
                      <div className="mt-2 rounded-2xl overflow-hidden border border-cyan-400/30 h-56">
                        <MapContainer
                          center={[7.8731, 80.7718]}
                          zoom={7}
                          style={{ height: '100%', width: '100%' }}
                          zoomControl={true}
                        >
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          <MapClickHandler onPick={handleMapPick} />
                          {pickedLatLng && (
                            <Marker position={[pickedLatLng.lat, pickedLatLng.lng]} icon={pickerIcon} />
                          )}
                        </MapContainer>
                      </div>
                    )}
                    {pickedLatLng && !showMapPicker && (
                      <p className="text-[10px] text-cyan-400 font-bold px-1">
                        📍 {pickedLatLng.lat.toFixed(5)}, {pickedLatLng.lng.toFixed(5)}
                        <button type="button" onClick={() => { setPickedLatLng(null); setFormState(p => ({ ...p, latitude: undefined, longitude: undefined })) }} className="ml-2 text-slate-500 hover:text-red-400 underline">clear</button>
                      </p>
                    )}
                  </div>

                  {/* Category */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{t('damage_assessment_page.category')}</label>
                    <div className="relative">
                      <select
                        className={selectClass}
                        value={formState.category}
                        onChange={e => setFormState(p => ({ ...p, category: e.target.value }))}
                      >
                        <option value="RESIDENTIAL">{t('damage_assessment_page.residential')}</option>
                        <option value="AGRICULTURAL">{t('damage_assessment_page.agricultural')}</option>
                        <option value="COMMERCIAL">{t('damage_assessment_page.commercial')}</option>
                        <option value="INFRASTRUCTURE">{t('damage_assessment_page.infrastructure')}</option>
                        <option value="UTILITY">{t('damage_assessment_page.utility')}</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>

                  {/* Structural Damage */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                      {t('damage_assessment_page.structural_damage')} {aiData && <span className="text-purple-400 normal-case">{t('damage_assessment_page.ai_label')}</span>}
                    </label>
                    <div className="relative">
                      <select
                        className={cn(selectClass, aiData ? 'border-purple-500/40 bg-purple-500/10 text-purple-300 cursor-not-allowed' : '')}
                        value={formState.structuralDamage}
                        onChange={e => setFormState(p => ({ ...p, structuralDamage: e.target.value }))}
                        disabled={!!aiData}
                      >
                        <option value="NONE">{t('damage_assessment_page.no_damage')}</option>
                        <option value="MINOR">{t('damage_assessment_page.minor')}</option>
                        <option value="MODERATE">{t('damage_assessment_page.moderate')}</option>
                        <option value="MAJOR">{t('damage_assessment_page.major')}</option>
                        <option value="TOTAL_LOSS">{t('damage_assessment_page.total_loss')}</option>
                        <option value="DESTROYED">{t('damage_assessment_page.destroyed')}</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>

                  {/* Crop Damage */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{t('damage_assessment_page.crop_damage')}</label>
                    <div className="relative">
                      <select
                        className={selectClass}
                        value={formState.cropDamage}
                        onChange={e => setFormState(p => ({ ...p, cropDamage: e.target.value }))}
                      >
                        <option value="NONE">{t('damage_assessment_page.no_damage')}</option>
                        <option value="MINOR">{t('damage_assessment_page.minor')}</option>
                        <option value="MODERATE">{t('damage_assessment_page.moderate')}</option>
                        <option value="TOTAL_LOSS">{t('damage_assessment_page.total_loss')}</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>

                  {/* Property Ownership */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{t('damage_assessment_page.property_ownership')}</label>
                    <div className="relative">
                      <select
                        className={selectClass}
                        value={formState.propertyOwnershipStatus}
                        onChange={e => setFormState(p => ({ ...p, propertyOwnershipStatus: e.target.value }))}
                      >
                        <option value="Owned">{t('damage_assessment_page.owned')}</option>
                        <option value="Rented">{t('damage_assessment_page.rented')}</option>
                        <option value="Squatter">{t('damage_assessment_page.squatter')}</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>

                  {/* Income Bracket */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{t('damage_assessment_page.income_bracket')}</label>
                    <div className="relative">
                      <select
                        className={selectClass}
                        value={formState.incomeBracket}
                        onChange={e => setFormState(p => ({ ...p, incomeBracket: e.target.value }))}
                      >
                        <option value="< 50,000 LKR">{t('damage_assessment_page.under_50k')}</option>
                        <option value="50k - 100k LKR">{t('damage_assessment_page.bracket_50k_100k')}</option>
                        <option value="> 100k LKR">{t('damage_assessment_page.over_100k')}</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>

                  {/* Affected Persons */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{t('damage_assessment_page.affected_persons')}</label>
                    <input
                      type="number" min="0" required
                      className={inputClass}
                      value={formState.affectedPersons}
                      onChange={e => setFormState(p => ({ ...p, affectedPersons: parseInt(e.target.value) || 0 }))}
                    />
                  </div>

                  {/* Vulnerability Score */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{t('damage_assessment_page.vulnerability_score')}</label>
                    <input
                      type="number" min="1" max="10" required
                      className={inputClass}
                      title="Based on elderly, children, disabled members"
                      value={formState.familyVulnerabilityScore}
                      onChange={e => setFormState(p => ({ ...p, familyVulnerabilityScore: parseInt(e.target.value) || 1 }))}
                    />
                  </div>

                  {/* Estimated Loss */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                      {t('damage_assessment_page.estimated_loss')} {aiData && <span className="text-purple-400 normal-case">{t('damage_assessment_page.ai_estimated')}</span>}
                    </label>
                    <input
                      type="number"
                      className={cn(inputClass, aiData ? 'border-purple-500/40 bg-purple-500/10 text-purple-300 cursor-not-allowed' : '')}
                      value={formState.estimatedLoss}
                      onChange={e => setFormState(p => ({ ...p, estimatedLoss: e.target.value }))}
                      readOnly={!!aiData}
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{t('damage_assessment_page.field_notes')}</label>
                    <textarea
                      rows={3}
                      placeholder={t('damage_assessment_page.field_notes_placeholder')}
                      className={cn(inputClass, 'resize-none')}
                      value={formState.notes}
                      onChange={e => setFormState(p => ({ ...p, notes: e.target.value }))}
                    />
                  </div>

                  {/* Submit */}
                  <div className="space-y-1.5 sm:col-span-2 pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="suraksha-button w-full h-14 uppercase tracking-widest text-[11px] font-black shadow-blue-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <TrendingUp className="w-5 h-5" />}
                      {t('damage_assessment_page.submit_assessment')}
                    </button>
                    <p className="text-center text-[10px] text-slate-500 mt-2 font-medium">{t('damage_assessment_page.submit_note')}</p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className={cn(
            "fixed bottom-8 right-8 z-[999999] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-8 duration-300 font-sans",
            toast.type === 'success'
              ? "bg-white dark:bg-[#131f33] text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-lg"
              : "bg-white dark:bg-[#131f33] text-red-600 dark:text-red-400 border border-red-500/30 shadow-lg"
          )}>
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-bold text-sm tracking-wide">{toast.message}</span>
          </div>
        )}
      </div>
    </>
  )
}
