import { useState, useEffect } from 'react'
import { Home, Plus, X, BarChart3, Clock, CheckCircle2, Loader2, Camera, Info, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { damageAssessmentService, incidentService } from '@/services/api'
import { formatDistanceToNow } from 'date-fns'

export default function DamageAssessmentPage() {
  const [assessments, setAssessments] = useState<any[]>([])
  const [incidents, setIncidents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [assessRes, incRes] = await Promise.all([
        damageAssessmentService.getAssessments(),
        incidentService.getIncidents()
      ])
      setAssessments(assessRes.data)
      setIncidents(incRes.data)
    } catch (error) {
      console.error('Failed to fetch assessment data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget as HTMLFormElement)
    const data = {
      incidentId: formData.get('incidentId'),
      location: formData.get('location'),
      category: formData.get('category'),
      structuralDamage: formData.get('structuralDamage'),
      cropDamage: formData.get('cropDamage'),
      affectedPersons: parseInt(formData.get('affectedPersons') as string),
      estimatedLoss: parseFloat(formData.get('estimatedLoss') as string),
      notes: formData.get('notes'),
      mediaUrls: []
    }

    try {
      setIsSubmitting(true)
      await damageAssessmentService.reportDamage(data)
      alert('Damage assessment reported successfully')
      setShowModal(false)
      fetchData()
    } catch (error) {
      console.error('Failed to report damage:', error)
      alert('Failed to report damage')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'TOTAL_LOSS': return 'text-red-600 bg-red-50'
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
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Damage Assessment</h1>
          <p className="text-slate-500 font-medium">Post-disaster recovery and loss estimation</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-[#0061ff] text-white rounded-2xl font-bold shadow-xl shadow-blue-500/25 hover:scale-[1.02] transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Report New Damage
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Processing Reports</p>
            </div>
          ) : assessments.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-200 rounded-[2.5rem] p-20 text-center space-y-4">
              <Home className="w-16 h-16 text-slate-200 mx-auto" />
              <h3 className="text-xl font-bold text-slate-700">No Assessments Yet</h3>
              <p className="text-slate-400 max-w-xs mx-auto">New damage reports will appear here once submitted by field officers or residents.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {assessments.map((item) => (
                <div key={item.id} className="group bg-white border border-slate-100 rounded-[2.5rem] p-8 hover:shadow-2xl hover:shadow-blue-500/5 transition-all">
                  <div className="flex flex-col md:flex-row gap-8">
                     <div className="w-full md:w-48 h-48 rounded-3xl bg-slate-50 overflow-hidden flex items-center justify-center border border-slate-100">
                        <Camera className="w-10 h-10 text-slate-200" />
                     </div>
                     <div className="flex-1 space-y-4">
                        <div className="flex justify-between items-start">
                           <div>
                              <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">{item.category}</span>
                              <h3 className="text-xl font-black text-slate-900 mt-1">{item.location}</h3>
                           </div>
                           <div className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest", 
                             item.status === 'VERIFIED' ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"
                           )}>
                              {item.status}
                           </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                           <div className="space-y-1">
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Structural</div>
                              <div className={cn("text-[10px] font-black px-2 py-1 rounded-lg inline-block", getLevelColor(item.structuralDamage))}>
                                 {item.structuralDamage.replace('_', ' ')}
                              </div>
                           </div>
                           <div className="space-y-1">
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Agriculture</div>
                              <div className={cn("text-[10px] font-black px-2 py-1 rounded-lg inline-block", getLevelColor(item.cropDamage))}>
                                 {item.cropDamage.replace('_', ' ')}
                              </div>
                           </div>
                           <div className="space-y-1 text-right">
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Affected</div>
                              <div className="text-sm font-black text-slate-700">{item.affectedPersons} Persons</div>
                           </div>
                           <div className="space-y-1 text-right">
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Est. Loss</div>
                              <div className="text-sm font-black text-blue-600">${item.estimatedLoss?.toLocaleString()}</div>
                           </div>
                        </div>

                        <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-slate-400">
                           <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                              <Clock className="w-4 h-4" />
                              {formatDistanceToNow(new Date(item.createdAt))} ago
                           </div>
                           <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                              <TrendingUp className="w-4 h-4" />
                              Relief Required
                           </div>
                        </div>
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
                 <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-2xl font-black">Loss Analysis</h3>
              <div className="space-y-4">
                 <div className="bg-white/5 rounded-2xl p-4 flex justify-between items-center">
                    <span className="text-slate-400 text-sm font-bold uppercase tracking-widest">Total Estimated Loss</span>
                    <span className="text-xl font-black text-blue-400">$1.2M</span>
                 </div>
                 <div className="bg-white/5 rounded-2xl p-4 flex justify-between items-center">
                    <span className="text-slate-400 text-sm font-bold uppercase tracking-widest">Verified Claims</span>
                    <span className="text-xl font-black text-green-400">84</span>
                 </div>
              </div>
           </div>

           <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 space-y-6">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                 <Info className="w-5 h-5 text-blue-500" />
                 Guidelines
              </h3>
              <ul className="space-y-4">
                 {[
                   "Provide clear, non-blurry photos",
                   "Estimate losses based on market value",
                   "Mention affected family members count",
                   "Include detailed description of structural cracks"
                 ].map((tip, i) => (
                   <li key={i} className="flex gap-3 text-sm text-slate-500 font-medium leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      {tip}
                   </li>
                 ))}
              </ul>
           </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-2xl font-black text-slate-900">Report Damage</h2>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-100 text-slate-400 hover:text-slate-600 transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 grid grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-2 col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Related Incident</label>
                <select name="incidentId" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none">
                  <option value="">Select Incident (Optional)</option>
                  {incidents.map(inc => <option key={inc.id} value={inc.id}>{inc.title}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Category</label>
                <select name="category" required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none">
                  <option value="RESIDENTIAL">Residential</option>
                  <option value="AGRICULTURAL">Agricultural</option>
                  <option value="COMMERCIAL">Commercial</option>
                  <option value="INFRASTRUCTURE">Infrastructure</option>
                  <option value="UTILITY">Utility</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Location</label>
                <input name="location" type="text" placeholder="Address or Area" required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Structural Damage</label>
                <select name="structuralDamage" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none">
                  <option value="NONE">None</option>
                  <option value="MINOR">Minor</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="MAJOR">Major</option>
                  <option value="TOTAL_LOSS">Total Loss</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Agricultural Damage</label>
                <select name="cropDamage" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none">
                  <option value="NONE">None</option>
                  <option value="MINOR">Minor</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="MAJOR">Major</option>
                  <option value="TOTAL_LOSS">Total Loss</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Affected Persons</label>
                <input name="affectedPersons" type="number" defaultValue="0" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Estimated Loss ($)</label>
                <input name="estimatedLoss" type="number" step="0.01" defaultValue="0" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" />
              </div>

              <div className="space-y-2 col-span-2 pt-4">
                <button 
                  disabled={isSubmitting}
                  className="w-full py-5 bg-[#0061ff] text-white rounded-2xl font-bold shadow-xl shadow-blue-500/25 hover:scale-[1.01] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Submit Assessment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
