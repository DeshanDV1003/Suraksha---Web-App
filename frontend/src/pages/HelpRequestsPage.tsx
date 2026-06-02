import { useState, useEffect } from 'react'
import { AlertTriangle, Clock, MapPin, Users, Loader2, Navigation, MessageSquare, CheckCircle, Smartphone } from 'lucide-react'
import { helpRequestService, volunteerService } from '@/services/api'
import { cn } from '@/lib/utils'

export default function HelpRequestsPage() {
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<any[]>([])
  const [clusters, setClusters] = useState<any[]>([])
  const [volunteers, setVolunteers] = useState<any[]>([])
  
  const [activeTab, setActiveTab] = useState('dispatch') // dispatch, map, sms
  
  // Assigning states
  const [assigningId, setAssigningId] = useState<string | null>(null)
  
  // SMS Simulator state
  const [smsPayload, setSmsPayload] = useState('HELP Rescue Flooded house near Main St 4')
  const [smsResponse, setSmsResponse] = useState('')

  const fetchData = async () => {
    try {
      setLoading(true)
      // Check escalations first
      await helpRequestService.checkEscalations()
      
      const [reqRes, clusRes, volRes] = await Promise.all([
        helpRequestService.getRequests(),
        helpRequestService.getClusters(),
        volunteerService.listVolunteers()
      ])
      
      setRequests(reqRes.data)
      setClusters(clusRes.data)
      setVolunteers(volRes.data.filter((v:any) => v.volunteerProfile?.checkIns?.some((c:any) => !c.checkOutTime)))
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000) // Poll every 30s
    return () => clearInterval(interval)
  }, [])

  const handleAssign = async (reqId: string, volId: string) => {
    try {
      setAssigningId(reqId)
      await helpRequestService.assignResponder(reqId, volId)
      fetchData()
    } finally {
      setAssigningId(null)
    }
  }

  const handleStatusUpdate = async (reqId: string, status: string) => {
    try {
      await helpRequestService.updateStatus(reqId, status)
      fetchData()
    } catch (e) {
      console.error(e)
    }
  }

  const simulateSms = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSmsResponse('Sending...')
      const res = await helpRequestService.mockSmsWebhook({ From: '+94770000000', Body: smsPayload })
      setSmsResponse(res.data)
      fetchData()
    } catch {
      setSmsResponse('Failed to send SMS.')
    }
  }

  if (loading && requests.length === 0) {
    return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-red-500" /></div>
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-[#1e293b]">SOS Command Center</h1>
        <p className="text-slate-500 mt-1 font-medium">Manage distress signals, dispatch responders, and monitor active operations.</p>
      </div>

      <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
        {[
          { id: 'dispatch', label: 'Dispatch Queue', icon: Navigation },
          { id: 'map', label: 'Clustered Hotspots', icon: MapPin },
          { id: 'sms', label: 'SMS Intake Simulator', icon: Smartphone }
        ].map(tab => (
          <button
            key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all",
              activeTab === tab.id ? "bg-red-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dispatch' && (
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Queue */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-black text-slate-800">Pending Requests</h2>
            
            {requests.filter(r => r.status === 'PENDING').length === 0 && (
               <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-500">
                 No pending SOS signals.
               </div>
            )}

            {requests.filter(r => r.status === 'PENDING').map(req => (
              <div key={req.id} className={cn(
                "suraksha-card p-6 rounded-[1.5rem] relative overflow-hidden transition-all",
                req.escalationLevel === 'CRITICAL' ? 'border-2 border-red-500 ring-4 ring-red-500/20' : 
                req.escalationLevel === 'HIGH' ? 'border-2 border-orange-500 ring-4 ring-orange-500/20' : ''
              )}>
                {req.escalationLevel !== 'NONE' && (
                  <div className="absolute top-0 left-0 right-0 bg-red-600 text-white text-xs font-black text-center py-1 animate-pulse uppercase tracking-widest">
                    Escalated: Supervisor Notification Sent
                  </div>
                )}
                
                <div className={cn("flex justify-between items-start", req.escalationLevel !== 'NONE' ? 'mt-4' : '')}>
                  <div className="flex gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      req.priority === 'CRITICAL' ? 'bg-red-100 text-red-600' :
                      req.priority === 'HIGH' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                    )}>
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-lg text-slate-800">{req.type}</h3>
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wider",
                          req.priority === 'CRITICAL' ? 'bg-red-600 text-white' :
                          req.priority === 'HIGH' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'
                        )}>
                          {req.priority}
                        </span>
                      </div>
                      <p className="text-slate-500 font-medium mt-1">{req.description}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-6 p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2 text-slate-600 text-sm font-bold">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {req.location}
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 text-sm font-bold">
                    <Users className="w-4 h-4 text-slate-400" />
                    {req.peopleCount || 1} people
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 text-sm font-bold">
                    <Clock className="w-4 h-4 text-slate-400" />
                    {Math.floor((new Date().getTime() - new Date(req.createdAt).getTime()) / 60000)} mins ago
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <select 
                    className="flex-1 bg-slate-100 border-none p-3 rounded-xl font-bold text-sm outline-none cursor-pointer"
                    id={`assign-${req.id}`}
                  >
                    <option value="">Select Active Responder...</option>
                    {volunteers.map(v => (
                       <option key={v.id} value={v.id}>{v.name} (Active: {v.volunteerProfile?.checkIns[0]?.zone || 'Unknown'})</option>
                    ))}
                  </select>
                  <button 
                    disabled={assigningId === req.id}
                    onClick={() => {
                      const sel = document.getElementById(`assign-${req.id}`) as HTMLSelectElement;
                      if(sel.value) handleAssign(req.id, sel.value);
                    }}
                    className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center gap-2"
                  >
                    {assigningId === req.id ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Dispatch'}
                  </button>
                </div>

                {/* Audit Trail */}
                {req.escalations?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-red-100 space-y-2">
                    <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-2">Escalation Audit Log</p>
                    {req.escalations.map((esc:any) => (
                       <p key={esc.id} className="text-xs font-medium text-red-500 bg-red-50 p-2 rounded-lg">
                         <span className="font-bold opacity-70">[{new Date(esc.triggeredAt).toLocaleTimeString()}]</span> {esc.message}
                       </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Active Operations Sidebar */}
          <div className="space-y-4">
            <h2 className="text-xl font-black text-slate-800">Active Operations</h2>
            <div className="bg-slate-900 rounded-[1.5rem] p-6 space-y-4 shadow-xl">
               {requests.filter(r => ['ASSIGNED', 'EN_ROUTE', 'ON_SITE'].includes(r.status)).length === 0 && (
                 <p className="text-slate-400 text-sm text-center">No active operations.</p>
               )}
               {requests.filter(r => ['ASSIGNED', 'EN_ROUTE', 'ON_SITE'].includes(r.status)).map(req => (
                 <div key={req.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <h4 className="font-bold text-white mb-1">{req.type} - {req.location}</h4>
                    <p className="text-xs text-slate-400 mb-4">Priority: {req.priority}</p>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleStatusUpdate(req.id, 'EN_ROUTE')}
                        className={cn("flex-1 text-[10px] font-bold py-2 rounded uppercase tracking-wider", req.status === 'EN_ROUTE' ? "bg-blue-500 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600")}
                      >
                        En Route
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate(req.id, 'ON_SITE')}
                        className={cn("flex-1 text-[10px] font-bold py-2 rounded uppercase tracking-wider", req.status === 'ON_SITE' ? "bg-amber-500 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600")}
                      >
                        On Site
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate(req.id, 'RESOLVED')}
                        className="flex-1 text-[10px] font-bold py-2 rounded uppercase tracking-wider bg-slate-700 text-emerald-400 hover:bg-emerald-500 hover:text-white"
                      >
                        Resolve
                      </button>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'map' && (
        <div className="suraksha-card p-8 rounded-[1.5rem]">
           <h3 className="text-xl font-black text-[#1e293b] mb-2">Clustered Request Density</h3>
           <p className="text-slate-500 text-sm mb-6">Pending requests grouped by 1km grids for optimal responder routing.</p>
           
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clusters.length === 0 && <p className="text-slate-500">No geo-tagged pending requests.</p>}
              {clusters.map((cluster: any, idx: number) => (
                <div key={idx} className="bg-slate-50 border border-slate-100 p-6 rounded-2xl relative overflow-hidden">
                   <div className="absolute -right-6 -top-6 w-24 h-24 bg-red-100 rounded-full flex items-center justify-center opacity-50 pointer-events-none">
                     <span className="text-red-500 font-black text-3xl">{cluster.requestCount}</span>
                   </div>
                   <MapPin className="w-8 h-8 text-red-500 mb-4 relative z-10" />
                   <h4 className="font-black text-slate-800 text-lg relative z-10">Cluster #{idx + 1}</h4>
                   <p className="text-xs text-slate-500 font-bold mb-4 relative z-10">Grid: {cluster.centerLat}, {cluster.centerLng}</p>
                   
                   <div className="space-y-2 relative z-10">
                     {cluster.requests.slice(0, 3).map((r:any) => (
                       <div key={r.id} className="text-xs font-bold text-slate-700 flex justify-between bg-white p-2 rounded border border-slate-100">
                         <span>{r.type}</span>
                         <span className={r.priority === 'CRITICAL' ? 'text-red-500' : ''}>{r.priority}</span>
                       </div>
                     ))}
                     {cluster.requests.length > 3 && (
                       <p className="text-xs text-slate-400 font-bold mt-2">+{cluster.requests.length - 3} more requests</p>
                     )}
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {activeTab === 'sms' && (
        <div className="max-w-2xl mx-auto suraksha-card p-8 rounded-[1.5rem]">
          <div className="flex items-center gap-4 mb-6">
             <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
               <MessageSquare className="w-7 h-7 text-green-600" />
             </div>
             <div>
               <h3 className="text-2xl font-black text-[#1e293b]">SMS & WhatsApp Intake</h3>
               <p className="text-slate-500 text-sm font-medium">Test the public webhook endpoint used by our Twilio integration.</p>
             </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl space-y-4 mb-6 shadow-inner">
             <div className="flex gap-2 items-end">
               <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-bold shrink-0">CIT</div>
               <div className="bg-slate-800 p-3 rounded-2xl rounded-bl-none text-slate-200 text-sm max-w-[80%] border border-slate-700">
                 Send <strong className="text-white">HELP [Type] [Location] [Count]</strong> to 1919.
               </div>
             </div>

             <form onSubmit={simulateSms} className="flex gap-2 items-end justify-end mt-4">
                <input 
                  type="text" value={smsPayload} onChange={e => setSmsPayload(e.target.value)} required
                  className="bg-emerald-900/50 border border-emerald-500/50 text-emerald-100 p-3 rounded-2xl rounded-br-none text-sm w-[80%] focus:outline-none focus:border-emerald-400"
                />
                <button type="submit" className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 hover:bg-emerald-400 transition-colors">
                  <Navigation className="w-4 h-4 -rotate-45 ml-1" />
                </button>
             </form>

             {smsResponse && (
               <div className="flex gap-2 items-end mt-4">
                 <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">SYS</div>
                 <div className="bg-slate-800 p-3 rounded-2xl rounded-bl-none text-blue-300 text-sm max-w-[80%] border border-slate-700 font-mono">
                   {smsResponse}
                 </div>
               </div>
             )}
          </div>
          <p className="text-xs text-slate-400 text-center font-medium">Submitting this form triggers the same backend logic as an incoming Twilio webhook.</p>
        </div>
      )}
    </div>
  )
}
