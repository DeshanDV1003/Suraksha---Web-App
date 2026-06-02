import { useState, useEffect, useRef } from 'react'
import { HeartPulse, Plus, X, Shield, Users, Clock, Loader2, MessageSquare, Sparkles, Heart, Activity, BookOpen, UserCheck, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supportService, psychSupportService } from '@/services/api'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '@/hooks/useAuth'
import { io, Socket } from 'socket.io-client'

export default function SupportPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('chat') // chat, groups, guides, dashboard, checkins
  const [loading, setLoading] = useState(false)
  
  // Data States
  const [chatSessions, setChatSessions] = useState<any[]>([])
  const [activeChat, setActiveChat] = useState<any>(null)
  const [chatMessage, setChatMessage] = useState('')
  const socketRef = useRef<Socket | null>(null)

  const [groupSessions, setGroupSessions] = useState<any[]>([])
  const [guides, setGuides] = useState<any[]>([])
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [checkIns, setCheckIns] = useState<any[]>([])

  // Modal States
  const [showGroupModal, setShowGroupModal] = useState(false)

  useEffect(() => {
    fetchData(activeTab)
  }, [activeTab])

  useEffect(() => {
    // Setup Socket.IO for chat
    socketRef.current = io('http://localhost:3001')
    
    socketRef.current.on('receive_message', (message) => {
      if (activeChat && message.sessionId === activeChat.id) {
        setActiveChat((prev: any) => ({
          ...prev,
          messages: [...(prev.messages || []), message]
        }))
      }
    })

    return () => {
      socketRef.current?.disconnect()
    }
  }, [activeChat])

  const fetchData = async (tab: string) => {
    setLoading(true)
    try {
      if (tab === 'chat') {
        const res = await psychSupportService.getChats()
        setChatSessions(res.data)
      } else if (tab === 'groups') {
        const res = await psychSupportService.getGroups()
        setGroupSessions(res.data)
      } else if (tab === 'guides') {
        const res = await psychSupportService.getGuides()
        setGuides(res.data)
      } else if (tab === 'dashboard') {
        const res = await psychSupportService.getTrends()
        setDashboardData(res.data)
      } else if (tab === 'checkins') {
        const res = await psychSupportService.getCheckIns()
        setCheckIns(res.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // --- CHAT ACTIONS ---
  const handleAcceptChat = async (id: string) => {
    try {
      const res = await psychSupportService.acceptChat(id)
      socketRef.current?.emit('join_chat', id)
      setActiveChat({ ...res.data, messages: [] })
      fetchData('chat')
    } catch (e) {
      console.error(e)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatMessage.trim() || !activeChat) return
    try {
      const msgData = {
        sessionId: activeChat.id,
        senderId: user?.userId,
        content: chatMessage,
        createdAt: new Date().toISOString()
      }
      // Optimistic UI & Socket Emit
      socketRef.current?.emit('send_message', msgData)
      setChatMessage('')
      // DB Save
      await psychSupportService.sendMessage(activeChat.id, msgData.content)
    } catch (e) {
      console.error(e)
    }
  }

  const handleEndChat = async () => {
    if (!activeChat) return
    const mood = prompt("Briefly describe the client's mood after this session:") || 'Stable'
    try {
      await psychSupportService.endChat(activeChat.id, mood)
      setActiveChat(null)
      fetchData('chat')
    } catch (e) {
      console.error(e)
    }
  }

  // --- GROUP ACTIONS ---
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget as HTMLFormElement)
    const data = {
      title: formData.get('title'),
      description: formData.get('description'),
      scheduledFor: formData.get('scheduledFor'),
      maxParticipants: parseInt(formData.get('maxParticipants') as string),
      counselorId: user?.userId,
      campId: 'Camp-Primary' // mock
    }
    try {
      await psychSupportService.createGroup(data)
      setShowGroupModal(false)
      fetchData('groups')
    } catch (e) {
      console.error(e)
    }
  }

  const handleJoinGroup = async (id: string) => {
    try {
      await psychSupportService.joinGroup(id)
      fetchData('groups')
    } catch (e) {
      console.error(e)
    }
  }

  // --- CHECK-IN ACTIONS ---
  const handleUpdateCheckIn = async (id: string, status: string) => {
    try {
      await psychSupportService.updateCheckIn(id, status, status === 'COMPLETED' ? null : new Date(Date.now() + 86400000 * 7).toISOString()) // next week if not completed
      fetchData('checkins')
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] rounded-[2.5rem] p-10 text-white shadow-2xl">
         <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-48 -mt-48 animate-pulse" />
         <div className="relative z-10 flex justify-between items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 mb-4">
                 <HeartPulse className="w-4 h-4 text-pink-300" /> Psychological Operations Center
              </div>
              <h1 className="text-3xl font-black tracking-tight leading-tight">Mental Wellbeing & Support</h1>
              <p className="text-indigo-100 text-sm mt-2 font-medium max-w-xl leading-relaxed">
                 Manage live crisis chats, schedule group therapy, monitor wellbeing trends, and track survivor check-ins.
              </p>
            </div>
            {activeTab === 'groups' && (
              <button onClick={() => setShowGroupModal(true)} className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-bold shadow-lg flex items-center gap-2 hover:scale-105 transition-transform">
                <Plus className="w-5 h-5" /> Schedule Group
              </button>
            )}
         </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
        <button onClick={() => setActiveTab('chat')} className={cn("flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all", activeTab === 'chat' ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-50")}>
          <MessageSquare className="w-4 h-4" /> Live Chat Queue
        </button>
        <button onClick={() => setActiveTab('groups')} className={cn("flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all", activeTab === 'groups' ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-50")}>
          <Users className="w-4 h-4" /> Group Therapy
        </button>
        <button onClick={() => setActiveTab('guides')} className={cn("flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all", activeTab === 'guides' ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-50")}>
          <BookOpen className="w-4 h-4" /> First-Aid Guides
        </button>
        <button onClick={() => setActiveTab('dashboard')} className={cn("flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all", activeTab === 'dashboard' ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-50")}>
          <Activity className="w-4 h-4" /> Trend Dashboard
        </button>
        <button onClick={() => setActiveTab('checkins')} className={cn("flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all", activeTab === 'checkins' ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-50")}>
          <UserCheck className="w-4 h-4" /> Survivor Check-Ins
        </button>
      </div>

      {loading && !activeChat ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>
      ) : (
        <>
          {/* TAB 1: LIVE CHAT QUEUE */}
          {activeTab === 'chat' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Queue List */}
              <div className="lg:col-span-1 space-y-4">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><Clock className="w-5 h-5 text-indigo-500" /> Waiting Queue</h3>
                {chatSessions.filter(s => s.status === 'WAITING').length === 0 ? (
                  <div className="bg-slate-50 rounded-2xl p-6 text-center text-slate-400 font-bold border border-dashed border-slate-200">No one is waiting in the queue.</div>
                ) : (
                  chatSessions.filter(s => s.status === 'WAITING').map(session => (
                    <div key={session.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-black text-slate-500 uppercase">Anonymous User</span>
                        <span className="text-[10px] font-black text-orange-500 bg-orange-50 px-2 py-1 rounded">WAITING</span>
                      </div>
                      <p className="text-xs text-slate-400 font-medium mb-4">Requested {formatDistanceToNow(new Date(session.startedAt))} ago</p>
                      <button onClick={() => handleAcceptChat(session.id)} className="w-full py-2 bg-indigo-50 text-indigo-600 font-bold rounded-xl text-sm hover:bg-indigo-600 hover:text-white transition-colors">
                        Accept Chat
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Active Chat Window */}
              <div className="lg:col-span-2">
                {activeChat ? (
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col h-[600px]">
                    <div className="p-4 bg-indigo-600 text-white flex justify-between items-center">
                      <div>
                        <h3 className="font-black flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/> Active Session</h3>
                        <p className="text-[10px] text-indigo-200 font-mono">ID: {activeChat.id}</p>
                      </div>
                      <button onClick={handleEndChat} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-xs font-bold transition-colors">
                        End Session & Check-out
                      </button>
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto bg-slate-50 flex flex-col gap-4">
                      <div className="text-center text-xs font-bold text-slate-400 my-4 uppercase tracking-widest bg-slate-200/50 py-1 rounded-full w-max mx-auto px-4">Chat Started</div>
                      {activeChat.messages?.map((msg: any, i: number) => {
                        const isMe = msg.senderId === user?.userId;
                        return (
                          <div key={i} className={cn("max-w-[80%] rounded-2xl p-4", isMe ? "bg-indigo-600 text-white self-end rounded-tr-sm" : "bg-white border border-slate-200 text-slate-700 self-start rounded-tl-sm")}>
                            <p className="text-sm font-medium">{msg.content}</p>
                            <span className={cn("text-[10px] mt-1 block opacity-70", isMe ? "text-indigo-200 text-right" : "text-slate-400")}>
                              {new Date(msg.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                    <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Type a supportive message..." 
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={chatMessage}
                        onChange={e => setChatMessage(e.target.value)}
                      />
                      <button type="submit" disabled={!chatMessage.trim()} className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50">
                        <Send className="w-5 h-5" />
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-3xl border border-dashed border-slate-200 h-full flex flex-col items-center justify-center text-slate-400 p-10 text-center">
                    <MessageSquare className="w-16 h-16 mb-4 text-slate-300" />
                    <h3 className="text-lg font-black text-slate-500 mb-2">No Active Session</h3>
                    <p className="text-sm font-medium">Accept a waiting user from the queue to start a confidential chat session. Sessions are end-to-end encrypted.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: GROUP THERAPY */}
          {activeTab === 'groups' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupSessions.length === 0 ? (
                <div className="col-span-full py-20 text-center text-slate-400 font-bold">No upcoming group sessions scheduled.</div>
              ) : (
                groupSessions.map((session) => (
                  <div key={session.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-black text-slate-800 text-lg">{session.title}</h3>
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-black uppercase">{session.status}</span>
                    </div>
                    <p className="text-sm text-slate-500 mb-4 line-clamp-3">{session.description}</p>
                    
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <Clock className="w-4 h-4 text-slate-300" /> {new Date(session.scheduledFor).toLocaleString()}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <Users className="w-4 h-4 text-slate-300" /> {session.participants?.length || 0} / {session.maxParticipants} Registered
                      </div>
                    </div>

                    <button 
                      onClick={() => handleJoinGroup(session.id)}
                      disabled={session.participants?.some((p:any) => p.userId === user?.userId)}
                      className="w-full py-3 bg-indigo-50 text-indigo-600 font-bold rounded-xl text-sm hover:bg-indigo-600 hover:text-white transition-colors disabled:opacity-50 disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      {session.participants?.some((p:any) => p.userId === user?.userId) ? "Already Registered" : "Register as Participant"}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: FIRST AID GUIDES */}
          {activeTab === 'guides' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {guides.map((guide) => (
                <div key={guide.id} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {guide.tags.split(',').map((tag: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-black uppercase">{tag.trim()}</span>
                    ))}
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mb-4">{guide.title}</h3>
                  <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">
                    {guide.content}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: TREND DASHBOARD */}
          {activeTab === 'dashboard' && dashboardData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
                   <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                     <Activity className="w-8 h-8 text-indigo-500" />
                   </div>
                   <div className="text-4xl font-black text-slate-800">{dashboardData.utilizationRate}%</div>
                   <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Counselor Utilization</div>
                </div>
                <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                   <h3 className="font-black text-slate-800 mb-4 uppercase text-xs tracking-widest">Top Presenting Issues (Simulated)</h3>
                   <div className="space-y-4">
                     {dashboardData.topIssues.map((issue: any, i: number) => (
                       <div key={i}>
                         <div className="flex justify-between text-sm font-bold text-slate-600 mb-1">
                           <span>{issue.issue}</span>
                           <span>{issue.count} cases</span>
                         </div>
                         <div className="w-full bg-slate-100 rounded-full h-2">
                           <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${(issue.count / 50) * 100}%` }}></div>
                         </div>
                       </div>
                     ))}
                   </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="font-black text-slate-800 mb-6 uppercase text-xs tracking-widest">Weekly Session Requests</h3>
                <div className="flex items-end gap-2 h-40">
                  {dashboardData.requestsByDay.map((day: any, i: number) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full bg-indigo-100 rounded-t-md relative group flex items-end justify-center">
                         <div className="w-full bg-indigo-500 rounded-t-md transition-all group-hover:bg-indigo-400" style={{ height: `${(day.requests / 30) * 100}%` }}></div>
                         <span className="absolute -top-6 text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100">{day.requests}</span>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase">{day.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CHECK-INS */}
          {activeTab === 'checkins' && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="p-4 pl-6">Survivor / ID</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Scheduled For</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {checkIns.length === 0 ? (
                    <tr><td colSpan={5} className="p-10 text-center text-slate-400 font-bold">No pending check-ins.</td></tr>
                  ) : (
                    checkIns.map(ci => (
                      <tr key={ci.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="p-4 pl-6 font-bold text-slate-800">{ci.user?.name || 'Anonymous User'}</td>
                        <td className="p-4 text-sm text-slate-500">{ci.type}</td>
                        <td className="p-4 text-sm font-bold text-slate-600">{new Date(ci.nextCheckInDate).toLocaleDateString()}</td>
                        <td className="p-4">
                          <span className={cn("px-2 py-1 rounded text-[10px] font-black uppercase", ci.checkInStatus === 'OVERDUE' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700')}>
                            {ci.checkInStatus}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right space-x-2">
                          <button onClick={() => handleUpdateCheckIn(ci.id, 'COMPLETED')} className="px-3 py-1.5 bg-green-50 text-green-600 text-xs font-bold rounded-lg hover:bg-green-100">Done</button>
                          <button onClick={() => handleUpdateCheckIn(ci.id, 'ESCALATED')} className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100">Escalate</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Create Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-950/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-900">Schedule Group Session</h2>
              <button onClick={() => setShowGroupModal(false)}><X className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Session Title</label>
                <input name="title" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Grief Support Circle" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Date & Time</label>
                <input type="datetime-local" name="scheduledFor" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Max Participants</label>
                <input type="number" name="maxParticipants" defaultValue={15} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Description</label>
                <textarea name="description" required rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"></textarea>
              </div>
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700">Create Session</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
