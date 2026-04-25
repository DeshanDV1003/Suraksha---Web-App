import { useState, useEffect } from 'react'
import { HandHelping, Plus, X, MapPin, Users, Clock, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { helpRequestService, userService } from '@/services/api'
import { formatDistanceToNow } from 'date-fns'

export default function HelpRequestsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await helpRequestService.getRequests()
      setRequests(res.data)
    } catch (error) {
      console.error('Failed to fetch help requests:', error)
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
      location: formData.get('location'),
      peopleCount: parseInt(formData.get('peopleCount') as string),
      priority: formData.get('priority')
    }

    try {
      setIsSubmitting(true)
      await helpRequestService.createRequest(data)
      alert('Help request submitted successfully')
      setShowModal(false)
      fetchData()
    } catch (error) {
      console.error('Failed to submit request:', error)
      alert('Failed to submit request')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Help Requests</h1>
          <p className="text-slate-500 font-medium">Coordinate emergency assistance and resources</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-[#0061ff] text-white rounded-2xl font-bold shadow-xl shadow-blue-500/25 hover:scale-[1.02] transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Request Help
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading Help Requests</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-[2.5rem] p-20 text-center space-y-4">
          <HandHelping className="w-16 h-16 text-slate-200 mx-auto" />
          <h3 className="text-xl font-bold text-slate-700">No Active Help Requests</h3>
          <p className="text-slate-400 max-w-xs mx-auto">All systems clear. No emergency requests reported in your area.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {requests.map((request) => (
            <div key={request.id} className="group bg-white border border-slate-100 rounded-[2rem] p-8 hover:shadow-2xl hover:shadow-blue-500/5 transition-all relative overflow-hidden">
               <div className={cn(
                 "absolute top-0 right-0 px-6 py-2 rounded-bl-3xl text-[10px] font-black uppercase tracking-widest",
                 request.priority === 'CRITICAL' ? "bg-red-500 text-white" : "bg-blue-500 text-white"
               )}>
                 {request.priority}
               </div>

               <div className="space-y-6">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                       <HandHelping className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                       <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Request Type</div>
                       <div className="text-lg font-bold text-slate-900">{request.type}</div>
                    </div>
                 </div>

                 <p className="text-slate-500 text-sm leading-relaxed line-clamp-3">{request.description}</p>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-slate-600">
                       <MapPin className="w-4 h-4 text-slate-300" />
                       <span className="text-xs font-bold truncate">{request.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                       <Users className="w-4 h-4 text-slate-300" />
                       <span className="text-xs font-bold">{request.peopleCount} People</span>
                    </div>
                 </div>

                 <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400">
                       <Clock className="w-4 h-4" />
                       <span className="text-[10px] font-bold uppercase tracking-widest">{formatDistanceToNow(new Date(request.createdAt))} ago</span>
                    </div>
                    <div className="flex items-center gap-2">
                       {request.verifierActions?.length > 0 ? (
                         <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-3 py-1 rounded-full">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-black uppercase">Verified</span>
                         </div>
                       ) : (
                         <div className="flex items-center gap-1.5 text-orange-500 bg-orange-50 px-3 py-1 rounded-full">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-black uppercase">Pending</span>
                         </div>
                       )}
                    </div>
                 </div>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-2xl font-black text-slate-900">Request Assistance</h2>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-100 text-slate-400 hover:text-slate-600 transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Request Category</label>
                  <select name="type" required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none">
                    <option value="Rescue">Rescue</option>
                    <option value="Medical">Medical</option>
                    <option value="Food/Water">Food/Water</option>
                    <option value="Shelter">Shelter</option>
                    <option value="Supplies">Supplies</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Priority Level</label>
                  <select name="priority" required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none">
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Location Details</label>
                <div className="relative">
                  <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <input name="location" type="text" placeholder="Building, street, or GPS" required className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Affected Persons</label>
                <input name="peopleCount" type="number" defaultValue="1" min="1" required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Describe the Situation</label>
                <textarea name="description" rows={3} required placeholder="What kind of help is needed immediately?" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none"></textarea>
              </div>

              <div className="pt-4">
                <button 
                  disabled={isSubmitting}
                  className="w-full py-5 bg-[#0061ff] text-white rounded-2xl font-bold shadow-xl shadow-blue-500/25 hover:scale-[1.01] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Submit Help Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
