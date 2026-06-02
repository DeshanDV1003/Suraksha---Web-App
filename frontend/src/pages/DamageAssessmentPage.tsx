import { useState, useEffect } from 'react'
import { Home, Plus, X, BarChart3, Clock, CheckCircle2, Loader2, Camera, Info, TrendingUp, ChevronDown, Sparkles, MapPin, ShieldCheck, Map } from 'lucide-react'
import { cn } from '@/lib/utils'
import { damageAssessmentService, incidentService } from '@/services/api'
import { formatDistanceToNow } from 'date-fns'

export default function DamageAssessmentPage() {
  const [assessments, setAssessments] = useState<any[]>([])
  const [incidents, setIncidents] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [activeTab, setActiveTab] = useState('verification') // verification, reports

  // AI Mock State
  const [aiLoading, setAiLoading] = useState(false)
  const [aiData, setAiData] = useState<any>(null)

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

  useEffect(() => {
    fetchData()
  }, [])

  const simulateAiUpload = async () => {
    setAiLoading(true)
    try {
      const res = await damageAssessmentService.aiClassifyImage('mock_image_url')
      setAiData(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setAiLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget as HTMLFormElement)
    const data = {
      incidentId: formData.get('incidentId'),
      location: formData.get('location'),
      category: formData.get('category'),
      structuralDamage: aiData?.severity || formData.get('structuralDamage'),
      cropDamage: formData.get('cropDamage'),
      affectedPersons: parseInt(formData.get('affectedPersons') as string),
      estimatedLoss: aiData?.estimatedCost || parseFloat(formData.get('estimatedLoss') as string),
      propertyOwnershipStatus: formData.get('propertyOwnershipStatus'),
      familyVulnerabilityScore: parseInt(formData.get('familyVulnerabilityScore') as string),
      incomeBracket: formData.get('incomeBracket'),
      notes: formData.get('notes'),
      aiEstimatedDamage: aiData?.severity,
      aiEstimatedCost: aiData?.estimatedCost,
      mediaUrls: ['mock_uploaded_photo']
    }

    try {
      setIsSubmitting(true)
      await damageAssessmentService.reportDamage(data)
      setShowModal(false)
      setAiData(null)
      fetchData()
    } catch (error) {
      console.error('Failed to report damage:', error)
      alert('Failed to report damage')
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateWorkflow = async (id: string, status: string) => {
    try {
      await damageAssessmentService.updateWorkflowStatus(id, status)
      fetchData()
    } catch (error) {
      console.error(error)
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'TOTAL_LOSS':
      case 'DESTROYED': return 'text-red-600 bg-red-50'
      case 'MAJOR': return 'text-orange-600 bg-orange-50'
      case 'MODERATE': return 'text-yellow-600 bg-yellow-50'
      case 'MINOR': return 'text-blue-600 bg-blue-50'
      default: return 'text-slate-400 bg-slate-50'
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1e293b]">Damage Assessment HQ</h1>
          <p className="text-slate-500 mt-1 font-medium">Verify field reports, process compensation, and analyze district impact.</p>
        </div>
        <button 
          onClick={() => { setShowModal(true); setAiData(null) }}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-[#0061ff] text-white rounded-2xl font-bold shadow-xl shadow-blue-500/25 hover:scale-[1.02] transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          New Field Report
        </button>
      </div>

      <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
        <button
          onClick={() => setActiveTab('verification')}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all",
            activeTab === 'verification' ? "bg-blue-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
          )}
        >
          <ShieldCheck className="w-4 h-4" />
          Verification Workflow
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all",
            activeTab === 'reports' ? "bg-blue-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
          )}
        >
          <Map className="w-4 h-4" />
          District Reports
        </button>
      </div>

      {activeTab === 'verification' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {loading ? (
              <div className="h-64 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
              </div>
            ) : assessments.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-200 rounded-[2.5rem] p-20 text-center space-y-4">
                <Home className="w-16 h-16 text-slate-200 mx-auto" />
                <h3 className="text-xl font-bold text-slate-700">No Assessments Yet</h3>
                <p className="text-slate-400 max-w-xs mx-auto">New damage reports from the mobile app will sync here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {assessments.map((item) => (
                  <div key={item.id} className="group bg-white border border-slate-100 rounded-[2.5rem] p-8 hover:shadow-2xl hover:shadow-blue-500/5 transition-all">
                    <div className="flex flex-col md:flex-row gap-8">
                      <div className="flex-1 space-y-4">
                          <div className="flex justify-between items-start">
                              <div>
                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">{item.category}</span>
                                <h3 className="text-xl font-black text-slate-900 mt-1 flex items-center gap-2">
                                  {item.location}
                                  {item.aiEstimatedDamage && (
                                    <span title="AI Verified Image" className="bg-purple-100 text-purple-600 p-1 rounded-full"><Sparkles className="w-3 h-3" /></span>
                                  )}
                                </h3>
                              </div>
                              <div className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest", 
                                item.status === 'APPROVED' ? "bg-green-50 text-green-600" : 
                                item.status === 'SENIOR_REVIEW' ? "bg-purple-50 text-purple-600" :
                                item.status === 'REJECTED' ? "bg-red-50 text-red-600" :
                                "bg-orange-50 text-orange-600"
                              )}>
                                {item.status.replace('_', ' ')}
                              </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl">
                              <div className="space-y-1">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Damage</div>
                                <div className={cn("text-[10px] font-black px-2 py-1 rounded-lg inline-block", getLevelColor(item.structuralDamage))}>
                                    {item.structuralDamage.replace('_', ' ')}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Est. Loss</div>
                                <div className="text-sm font-black text-slate-700">LKR {item.estimatedLoss?.toLocaleString()}</div>
                              </div>
                              <div className="space-y-1 col-span-2 text-right">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Compensation Eligibility</div>
                                <div className="text-sm font-black flex items-center justify-end gap-2">
                                  Score: {item.compensationEligibilityScore || 0}/100
                                  {item.compensationEligible ? 
                                    <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded font-bold">ELIGIBLE</span> :
                                    <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded font-bold">INELIGIBLE</span>
                                  }
                                </div>
                              </div>
                          </div>

                          {/* Verification Actions */}
                          {item.status !== 'APPROVED' && item.status !== 'REJECTED' && (
                            <div className="pt-4 border-t border-slate-50 flex gap-2">
                              {item.status === 'PENDING_REVIEW' && (
                                <button onClick={() => updateWorkflow(item.id, 'SENIOR_REVIEW')} className="flex-1 bg-purple-600 text-white text-xs font-bold py-3 rounded-xl hover:bg-purple-700 transition-colors">
                                  Escalate to Senior Review
                                </button>
                              )}
                              {item.status === 'SENIOR_REVIEW' && (
                                <button onClick={() => updateWorkflow(item.id, 'APPROVED')} className="flex-1 bg-green-600 text-white text-xs font-bold py-3 rounded-xl hover:bg-green-700 transition-colors">
                                  Approve & Generate Compensation Form
                                </button>
                              )}
                              <button onClick={() => updateWorkflow(item.id, 'REJECTED')} className="flex-1 bg-slate-100 text-slate-600 hover:text-red-600 text-xs font-bold py-3 rounded-xl hover:bg-red-50 transition-colors">
                                Reject Fraudulent Claim
                              </button>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
             <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6 shadow-2xl">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                   <ShieldCheck className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-2xl font-black">Verification Queue</h3>
                <div className="space-y-4">
                   <div className="bg-white/5 rounded-2xl p-4 flex justify-between items-center">
                      <span className="text-slate-400 text-sm font-bold uppercase tracking-widest">Pending Review</span>
                      <span className="text-xl font-black text-orange-400">{assessments.filter(a => a.status === 'PENDING_REVIEW').length}</span>
                   </div>
                   <div className="bg-white/5 rounded-2xl p-4 flex justify-between items-center">
                      <span className="text-slate-400 text-sm font-bold uppercase tracking-widest">Senior Review</span>
                      <span className="text-xl font-black text-purple-400">{assessments.filter(a => a.status === 'SENIOR_REVIEW').length}</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h2 className="text-2xl font-black text-slate-800 mb-6">District Summary Reports</h2>
          <p className="text-slate-500 mb-8">Aggregated damage statistics ready for government portal submission.</p>

          <div className="grid md:grid-cols-2 gap-6">
            {reports.map((report, i) => (
              <div key={i} className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-black text-slate-800">{report.name}</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{report.totalStructures} Structures Assessed</p>
                  </div>
                  <button onClick={() => alert(`Report for ${report.name} submitted to government portal successfully.`)} className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg shadow hover:bg-blue-700">
                    Submit to Govt
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between bg-white p-3 rounded-xl border border-slate-100 text-sm font-bold">
                    <span className="text-slate-500">Estimated Total Loss</span>
                    <span className="text-red-600">LKR {report.totalEstimatedLoss.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between bg-white p-3 rounded-xl border border-slate-100 text-sm font-bold">
                    <span className="text-slate-500">Affected Persons</span>
                    <span className="text-slate-800">{report.affectedPersons}</span>
                  </div>
                </div>
              </div>
            ))}
            {reports.length === 0 && <p className="text-slate-400 font-medium">No active district reports found.</p>}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex justify-center overflow-y-auto bg-slate-900/60 backdrop-blur-md p-4 py-8 sm:py-20 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 my-auto flex flex-col md:flex-row">
            
            {/* Left side: AI & Photo Upload */}
            <div className="w-full md:w-1/3 bg-slate-50 p-10 border-r border-slate-100 flex flex-col items-center justify-center text-center">
              <Sparkles className="w-12 h-12 text-purple-500 mb-4" />
              <h3 className="text-xl font-black text-slate-800 mb-2">AI Assessor</h3>
              <p className="text-xs text-slate-500 mb-8">Upload a photo. Our ML model will auto-classify the damage severity and estimate replacement costs.</p>
              
              {!aiData && !aiLoading && (
                <button type="button" onClick={simulateAiUpload} className="w-full bg-white border-2 border-dashed border-purple-200 text-purple-600 font-bold py-10 rounded-3xl hover:bg-purple-50 transition-colors flex flex-col items-center gap-2">
                  <Camera className="w-8 h-8" />
                  Upload Field Photo
                </button>
              )}

              {aiLoading && (
                <div className="w-full py-12 flex flex-col items-center gap-4 text-purple-500">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="text-xs font-bold uppercase tracking-widest animate-pulse">Running ML Model...</span>
                </div>
              )}

              {aiData && (
                <div className="w-full bg-purple-50 border border-purple-100 p-6 rounded-3xl text-left space-y-4">
                  <div className="flex items-center gap-2 text-purple-700 font-bold">
                    <CheckCircle2 className="w-5 h-5" /> Analysis Complete
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detected Severity</div>
                    <div className="text-lg font-black text-slate-800">{aiData.severity}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Est. Replacement Cost</div>
                    <div className="text-lg font-black text-slate-800">LKR {aiData.estimatedCost.toLocaleString()}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Right side: Form */}
            <div className="w-full md:w-2/3 flex flex-col">
              <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900">Field Report Form</h2>
                <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-10 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 overflow-y-auto max-h-[60vh]">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Location & GPS</label>
                  <div className="flex gap-2">
                    <input name="location" type="text" placeholder="e.g. 42 Main St, Colombo" required className="suraksha-input flex-1" />
                    <button type="button" className="bg-slate-100 px-4 rounded-xl text-slate-600 hover:bg-slate-200 flex items-center justify-center"><MapPin className="w-5 h-5"/></button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Category</label>
                  <div className="relative">
                    <select name="category" required className="suraksha-input appearance-none cursor-pointer pr-10">
                      <option value="RESIDENTIAL">Residential</option>
                      <option value="AGRICULTURAL">Agricultural</option>
                      <option value="COMMERCIAL">Commercial</option>
                      <option value="INFRASTRUCTURE">Infrastructure</option>
                      <option value="UTILITY">Utility</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Structural Damage</label>
                  <div className="relative">
                    <select name="structuralDamage" disabled={!!aiData} value={aiData?.severity} className="suraksha-input appearance-none cursor-pointer pr-10 disabled:bg-purple-50 disabled:border-purple-100 disabled:text-purple-700">
                      <option value="NONE">None</option>
                      <option value="MINOR">Minor</option>
                      <option value="MODERATE">Moderate</option>
                      <option value="MAJOR">Major</option>
                      <option value="TOTAL_LOSS">Total Loss</option>
                      <option value="DESTROYED">Destroyed</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Property Ownership</label>
                  <div className="relative">
                    <select name="propertyOwnershipStatus" required className="suraksha-input appearance-none cursor-pointer pr-10">
                      <option value="Owned">Owned</option>
                      <option value="Rented">Rented</option>
                      <option value="Squatter">Squatter / Unauthorized</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Income Bracket</label>
                  <div className="relative">
                    <select name="incomeBracket" required className="suraksha-input appearance-none cursor-pointer pr-10">
                      <option value="< 50,000 LKR">Under 50,000 LKR</option>
                      <option value="50k - 100k LKR">50,000 - 100,000 LKR</option>
                      <option value="> 100k LKR">Over 100,000 LKR</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Vulnerability Score (1-10)</label>
                  <input name="familyVulnerabilityScore" type="number" min="1" max="10" defaultValue="5" required className="suraksha-input" title="Based on elderly, children, disabled members" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Estimated Loss (LKR)</label>
                  <input name="estimatedLoss" type="number" disabled={!!aiData} value={aiData?.estimatedCost} className="suraksha-input disabled:bg-purple-50 disabled:border-purple-100 disabled:text-purple-700 font-bold" />
                </div>

                <div className="space-y-1.5 sm:col-span-2 pt-4">
                  <button disabled={isSubmitting} className="suraksha-button w-full h-14 uppercase tracking-widest text-[11px] font-black shadow-blue-500/30">
                    {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Submit Assessment"}
                  </button>
                  <p className="text-center text-[10px] text-slate-400 mt-2 font-medium">Submitting will auto-calculate compensation eligibility.</p>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
