import { useState, useEffect } from 'react'
import { HeartPulse, Plus, X, Shield, Users, Clock, Loader2, MessageSquare, Sparkles, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supportService } from '@/services/api'
import { formatDistanceToNow } from 'date-fns'
import { useTranslation } from 'react-i18next'

export default function SupportPage() {
  const { t } = useTranslation()
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await supportService.getRequests()
      setRequests(res.data)
    } catch (error) {
      console.error('Failed to fetch support requests:', error)
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
      type: formData.get('type'),
      description: formData.get('description'),
      urgency: formData.get('urgency'),
      anonymous: formData.get('anonymous') === 'on',
      location: formData.get('location'),
      affectedCount: parseInt(formData.get('affectedCount') as string)
    }

    try {
      setIsSubmitting(true)
      await supportService.createRequest(data)
      alert('Support request submitted. A counselor will contact you soon.')
      setShowModal(false)
      fetchData()
    } catch (error) {
      console.error('Failed to submit support request:', error)
      alert('Failed to submit request')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-1000 pb-20">
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-[3rem] p-12 md:p-20 text-white shadow-2xl">
         <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-48 -mt-48 animate-pulse" />
         <div className="relative z-10 max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-widest border border-white/10">
               <Sparkles className="w-4 h-4 text-yellow-300" />
               Mental Well-being Support
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#1e293b]">You are not <br/> alone in this.</h1>
            <p className="text-slate-500 mt-1 font-medium">
               Disasters are overwhelming. Our certified trauma counselors and grief support teams are available 24/7 to help you navigate through these difficult times.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
               <button 
                 onClick={() => setShowModal(true)}
                 className="px-10 py-5 bg-white text-indigo-600 rounded-2xl font-black text-lg shadow-xl hover:scale-[1.02] transition-all active:scale-95"
               >
                 Talk to a Counselor
               </button>
               <button className="px-10 py-5 bg-indigo-500/30 backdrop-blur-md border border-white/20 text-white rounded-2xl font-black text-lg hover:bg-indigo-500/40 transition-all">
                 Browse Resources
               </button>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
         <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
               <h2 className="text-3xl font-black text-slate-900 tracking-tight">Active Support Sessions</h2>
               <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                  Counselors Online
               </div>
            </div>

            {loading ? (
              <div className="h-64 flex flex-col items-center justify-center space-y-4">
                 <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                 <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Connecting with Care Teams</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-[3rem] p-20 text-center space-y-6 shadow-sm">
                 <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto">
                    <HeartPulse className="w-12 h-12 text-indigo-300" />
                 </div>
                 <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-900">No Pending Requests</h3>
                    <p className="text-slate-400 max-w-sm mx-auto font-medium">All sessions are currently being handled or completed. Don't hesitate to reach out if you need someone to talk to.</p>
                 </div>
              </div>
            ) : (
              <div className="space-y-6">
                {requests.map((request) => (
                  <div key={request.id} className="group bg-white border border-slate-100 rounded-[2.5rem] p-10 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all">
                     <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="space-y-4 flex-1">
                           <div className="flex items-center gap-3">
                              <span className={cn(
                                "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                                request.urgency === 'CRITICAL' ? "bg-red-50 text-red-600" : 
                                request.urgency === 'HIGH' ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"
                              )}>
                                {request.urgency} Priority
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{request.type}</span>
                           </div>
                           <h3 className="text-2xl font-black text-slate-900 leading-tight">
                              {request.anonymous ? 'Anonymous Support Request' : `Session for ${request.user?.name}`}
                           </h3>
                           <p className="text-slate-500 text-lg font-medium leading-relaxed">{request.description}</p>
                           
                           <div className="flex items-center gap-6 pt-2">
                              <div className="flex items-center gap-2 text-slate-400">
                                 <Clock className="w-5 h-5" />
                                 <span className="text-xs font-bold uppercase tracking-widest">{formatDistanceToNow(new Date(request.createdAt))} ago</span>
                              </div>
                              <div className="flex items-center gap-2 text-slate-400">
                                 <Users className="w-5 h-5" />
                                 <span className="text-xs font-bold uppercase tracking-widest">{request.affectedCount} Affected</span>
                              </div>
                           </div>
                        </div>
                        <div className="flex md:flex-col justify-end gap-3">
                           <button className="px-8 py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-sm hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                              View Details
                           </button>
                           <button className={cn(
                             "px-8 py-4 rounded-2xl font-black text-sm transition-all",
                             request.status === 'PENDING' ? "bg-slate-100 text-slate-400" : "bg-green-50 text-green-600"
                           )}>
                              {request.status}
                           </button>
                        </div>
                     </div>
                  </div>
                ))}
              </div>
            )}
         </div>

         <div className="space-y-8">
            <div className="bg-white border border-slate-100 rounded-[3rem] p-10 space-y-8 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-full blur-3xl -mr-16 -mt-16" />
               <h3 className="text-2xl font-black text-slate-900 relative z-10">Why Speak Up?</h3>
               <div className="space-y-6 relative z-10">
                  {[
                    { icon: Shield, title: "100% Confidential", desc: "Your identity can remain anonymous throughout the process." },
                    { icon: Heart, title: "Expert Care", desc: "Certified trauma specialists with emergency response experience." },
                    { icon: MessageSquare, title: "Easy Access", desc: "Available via chat, voice, or in-person sessions at camps." }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-5">
                       <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-indigo-50 transition-colors">
                          <item.icon className="w-7 h-7 text-indigo-500" />
                       </div>
                       <div>
                          <h4 className="font-black text-slate-900">{item.title}</h4>
                          <p className="text-sm text-slate-500 font-medium leading-relaxed mt-1">{item.desc}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="bg-slate-900 rounded-[3rem] p-10 text-white space-y-6 shadow-2xl">
               <h3 className="text-2xl font-black">Need immediate help?</h3>
               <p className="text-slate-400 font-medium">If this is a life-threatening emergency, please contact the local emergency services immediately.</p>
               <div className="space-y-4 pt-4">
                  <div className="p-6 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center">
                     <span className="font-bold text-slate-300">Crisis Hotline</span>
                     <span className="text-xl font-black text-blue-400">1926</span>
                  </div>
                  <div className="p-6 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center">
                     <span className="font-bold text-slate-300">National HQ</span>
                     <span className="text-xl font-black text-indigo-400">011-234-5678</span>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-950/40 backdrop-blur-xl p-4 animate-in fade-in duration-500">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="px-12 py-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-3xl font-black text-slate-900">Request Counseling</h2>
              <button onClick={() => setShowModal(false)} className="w-12 h-12 flex items-center justify-center rounded-full bg-white border border-slate-100 text-slate-400 hover:text-slate-600 transition-all hover:scale-110">
                <X className="w-8 h-8" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-12 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Support Type</label>
                  <select name="type" required className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none">
                    <option value="TRAUMA_CARE">Trauma Care</option>
                    <option value="GRIEF_SUPPORT">Grief Support</option>
                    <option value="COUNSELING">General Counseling</option>
                    <option value="CHILD_SUPPORT">Child Support</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Urgency Level</label>
                  <select name="urgency" required className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none">
                    <option value="LOW">Routine</option>
                    <option value="MEDIUM">Immediate</option>
                    <option value="HIGH">Urgent</option>
                    <option value="CRITICAL">Crisis</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">How can we help?</label>
                <textarea name="description" rows={3} required placeholder="Feel free to share what's on your mind..." className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none"></textarea>
              </div>

              <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <input 
                  name="anonymous"
                  type="checkbox"
                  className="w-8 h-8 rounded-xl text-indigo-600 focus:ring-indigo-500 border-slate-200 transition-all cursor-pointer"
                />
                <div className="flex-1">
                   <div className="text-sm font-black text-slate-900 uppercase tracking-tight">Stay Anonymous</div>
                   <p className="text-xs text-slate-400 font-medium">Your session will be identified only by a secure ID</p>
                </div>
              </div>

              <div className="pt-6">
                <button 
                  disabled={isSubmitting}
                  className="w-full py-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-indigo-500/30 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isSubmitting ? <Loader2 className="w-7 h-7 animate-spin" /> : "Request Session Now"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
