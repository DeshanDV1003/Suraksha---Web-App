import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { HeartPulse, Plus, X, Users, Clock, Loader2, MessageSquare, BrainCircuit, Activity, BookOpen, UserCheck, Send, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { psychSupportService } from '@/services/api'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '@/hooks/useAuth'
import { io, Socket } from 'socket.io-client'
import PageBreadcrumb from "@/components/common/PageBreadCrumb"
import PageMeta from "@/components/common/PageMeta"

function CitizenSupportView() {
  const { t } = useTranslation()
  const [guides, setGuides] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [myChats, setMyChats] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [moodSelected, setMoodSelected] = useState('')
  const [moodSubmitted, setMoodSubmitted] = useState(false)
  const [chatRequested, setChatRequested] = useState(false)
  const [chatRequestLoading, setChatRequestLoading] = useState(false)
  const [activeSection, setActiveSection] = useState<'chat' | 'groups' | 'mood' | 'guides'>('chat')

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [guidesRes, groupsRes, chatsRes] = await Promise.all([
          psychSupportService.getGuides(),
          psychSupportService.getGroups(),
          psychSupportService.getMyChats()
        ])
        setGuides(guidesRes.data)
        setGroups(groupsRes.data)
        setMyChats(chatsRes.data.filter((c: any) => c.status !== 'MOOD_LOG'))
        if (chatsRes.data.some((c: any) => c.status === 'WAITING' || c.status === 'ACTIVE')) {
          setChatRequested(true)
        }
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const handleRequestChat = async () => {
    setChatRequestLoading(true)
    try {
      await psychSupportService.createChatRequest({ moodBefore: moodSelected || undefined })
      setChatRequested(true)
      const res = await psychSupportService.getMyChats()
      setMyChats(res.data.filter((c: any) => c.status !== 'MOOD_LOG'))
      showToast(t('support_citizen.toast_chat_sent'))
    } catch {
      showToast(t('support_citizen.toast_chat_failed'), 'error')
    } finally {
      setChatRequestLoading(false)
    }
  }

  const handleJoinGroup = async (id: string) => {
    try {
      await psychSupportService.joinGroup(id)
      showToast(t('support_citizen.toast_registered'))
      const res = await psychSupportService.getGroups()
      setGroups(res.data)
    } catch {
      showToast(t('support_citizen.toast_register_failed'), 'error')
    }
  }

  const handleMoodSubmit = async () => {
    if (!moodSelected) return
    try {
      await psychSupportService.submitMood(moodSelected)
      setMoodSubmitted(true)
      showToast(t('support_citizen.toast_mood_recorded'))
    } catch {
      showToast(t('support_citizen.toast_mood_failed'), 'error')
    }
  }

  const MOODS = [
    { emoji: '😊', label: t('support_citizen.mood_good'), value: 'GOOD' },
    { emoji: '😐', label: t('support_citizen.mood_okay'), value: 'OKAY' },
    { emoji: '😟', label: t('support_citizen.mood_anxious'), value: 'ANXIOUS' },
    { emoji: '😢', label: t('support_citizen.mood_sad'), value: 'SAD' },
    { emoji: '😠', label: t('support_citizen.mood_frustrated'), value: 'FRUSTRATED' },
    { emoji: '😔', label: t('support_citizen.mood_hopeless'), value: 'HOPELESS' },
  ]

  const STATUS_COLORS: Record<string, string> = {
    WAITING: 'bg-yellow-100 text-yellow-700',
    ACTIVE: 'bg-green-100 text-green-700',
    COMPLETED: 'bg-slate-100 text-slate-500',
  }

  const SECTIONS: { key: 'chat' | 'groups' | 'mood' | 'guides'; label: string; icon: any }[] = [
    { key: 'chat', label: t('support_citizen.section_chat'), icon: MessageSquare },
    { key: 'groups', label: t('support_citizen.section_groups'), icon: Users },
    { key: 'mood', label: t('support_citizen.section_mood'), icon: HeartPulse },
    { key: 'guides', label: t('support_citizen.section_guides'), icon: BookOpen },
  ]

  return (
    <>
      <PageMeta title="Support | Suraksha" description="Suraksha Support Page" />
      <PageBreadcrumb pageTitle={t('support_citizen.breadcrumb')} />

      {toast && (
        <div className={cn('fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-white font-semibold shadow-xl text-sm', toast.type === 'error' ? 'bg-red-500' : 'bg-green-500')}>
          {toast.message}
        </div>
      )}

      <div className="space-y-6 animate-in fade-in duration-700 pb-10">

        {/* Hero */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] rounded-[2.5rem] p-8 text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-48 -mt-48" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 mb-4">
              <HeartPulse className="w-4 h-4 text-pink-300" /> {t('support_citizen.hero_badge')}
            </div>
            <h1 className="text-2xl font-black tracking-tight">{t('support_citizen.hero_title')}</h1>
            <p className="text-indigo-100 text-sm mt-1 max-w-lg">{t('support_citizen.hero_sub')}</p>
          </div>
        </div>

        {/* Nav */}
        <div className="flex flex-wrap gap-2 bg-slate-100 dark:bg-[#131f33] p-2 rounded-2xl border border-slate-200 dark:border-cyan-400/10">
          {SECTIONS.map(s => (
            <button key={s.key} onClick={() => setActiveSection(s.key)}
              className={cn('flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all',
                activeSection === s.key ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5')}>
              <s.icon className="w-4 h-4" /> {s.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-400" /></div>
        ) : (
          <>
            {/* Request Support */}
            {activeSection === 'chat' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Request card */}
                <div className="bg-white dark:bg-[#131f33] rounded-2xl border border-slate-200 dark:border-cyan-400/10 p-6 space-y-5">
                  <h2 className="font-black text-lg text-slate-800 dark:text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-indigo-500" /> {t('support_citizen.talk_title')}
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">{t('support_citizen.talk_desc')}</p>

                  {chatRequested ? (
                    <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-700">
                      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                      <div>
                        <p className="font-bold text-green-700 dark:text-green-400 text-sm">{t('support_citizen.request_sent_title')}</p>
                        <p className="text-xs text-green-600 dark:text-green-500">{t('support_citizen.request_sent_desc')}</p>
                      </div>
                    </div>
                  ) : (
                    <button onClick={handleRequestChat} disabled={chatRequestLoading}
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
                      {chatRequestLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                      {t('support_citizen.request_btn')}
                    </button>
                  )}
                </div>

                {/* My sessions */}
                <div className="bg-white dark:bg-[#131f33] rounded-2xl border border-slate-200 dark:border-cyan-400/10 p-6 space-y-4">
                  <h2 className="font-black text-lg text-slate-800 dark:text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-500" /> {t('support_citizen.my_sessions')}
                  </h2>
                  {myChats.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-8">{t('support_citizen.no_sessions')}</p>
                  ) : (
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {myChats.map((s: any) => (
                        <div key={s.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-sm text-slate-800 dark:text-white">{t('support_citizen.session_label')} {formatDistanceToNow(new Date(s.startedAt), { addSuffix: true })}</p>
                            <p className="text-xs text-slate-400">{s.messages?.length || 0} {t('support_citizen.messages')}</p>
                          </div>
                          <span className={cn('px-3 py-1 rounded-full text-xs font-bold', STATUS_COLORS[s.status] || 'bg-slate-100 text-slate-500')}>
                            {s.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Group Sessions */}
            {activeSection === 'groups' && (
              <div className="space-y-4">
                <h2 className="font-black text-lg text-slate-800 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-500" /> {t('support_citizen.groups_title')}
                </h2>
                {groups.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">{t('support_citizen.no_groups')}</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groups.map((g: any) => (
                      <div key={g.id} className="bg-white dark:bg-[#131f33] rounded-2xl border border-slate-200 dark:border-cyan-400/10 p-5 space-y-3">
                        <div>
                          <p className="font-black text-slate-800 dark:text-white">{g.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{g.description}</p>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(g.scheduledFor).toLocaleString()}</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {g.participants?.length || 0}/{g.maxParticipants}</span>
                        </div>
                        <button onClick={() => handleJoinGroup(g.id)}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                          <Plus className="w-4 h-4" /> {t('support_citizen.register')}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Mood Check-In */}
            {activeSection === 'mood' && (
              <div className="max-w-lg mx-auto">
                <div className="bg-white dark:bg-[#131f33] rounded-2xl border border-slate-200 dark:border-cyan-400/10 p-8 space-y-6 text-center">
                  <HeartPulse className="w-10 h-10 text-pink-500 mx-auto" />
                  <div>
                    <h2 className="font-black text-xl text-slate-800 dark:text-white">{t('support_citizen.mood_title')}</h2>
                    <p className="text-slate-400 text-sm mt-1">{t('support_citizen.mood_sub')}</p>
                  </div>
                  {moodSubmitted ? (
                    <div className="py-6">
                      <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                      <p className="font-bold text-green-600 dark:text-green-400">{t('support_citizen.mood_thanks')}</p>
                      <button onClick={() => { setMoodSubmitted(false); setMoodSelected('') }}
                        className="mt-4 text-indigo-500 text-sm underline">{t('support_citizen.mood_again')}</button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-3">
                        {MOODS.map(m => (
                          <button key={m.value} onClick={() => setMoodSelected(m.value)}
                            className={cn('p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all font-bold text-sm',
                              moodSelected === m.value
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 scale-105'
                                : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300')}>
                            <span className="text-3xl">{m.emoji}</span>
                            {m.label}
                          </button>
                        ))}
                      </div>
                      <button onClick={handleMoodSubmit} disabled={!moodSelected}
                        className="w-full py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-40 transition-colors">
                        <Send className="w-4 h-4" /> {t('support_citizen.mood_submit')}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Guides */}
            {activeSection === 'guides' && (
              <div className="space-y-4">
                <h2 className="font-black text-lg text-slate-800 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-500" /> {t('support_citizen.guides_title')}
                </h2>
                {guides.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">{t('support_citizen.no_guides')}</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {guides.map((g: any) => (
                      <div key={g.id} className="bg-white dark:bg-[#131f33] rounded-2xl border border-slate-200 dark:border-cyan-400/10 p-5 space-y-3 hover:shadow-lg transition-shadow">
                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-black text-slate-800 dark:text-white text-sm">{g.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-3">{g.content}</p>
                        </div>
                        {g.category && (
                          <span className="inline-block px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold">
                            {g.category}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

export default function SupportPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('chat')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null)

  const [chatSessions, setChatSessions] = useState<any[]>([])
  const [activeChat, setActiveChat] = useState<any>(null)
  const [chatMessage, setChatMessage] = useState('')
  const [endMood, setEndMood] = useState('')
  const [showEndModal, setShowEndModal] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const activeChatRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [groupSessions, setGroupSessions] = useState<any[]>([])
  const [guides, setGuides] = useState<any[]>([])
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [checkIns, setCheckIns] = useState<any[]>([])
  const [showGroupModal, setShowGroupModal] = useState(false)

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Keep ref in sync so socket listener never has a stale closure
  useEffect(() => { activeChatRef.current = activeChat }, [activeChat])

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeChat?.messages])

  // Create socket ONCE
  useEffect(() => {
    socketRef.current = io('http://localhost:3001')
    socketRef.current.on('receive_message', (message) => {
      if (activeChatRef.current && message.sessionId === activeChatRef.current.id) {
        setActiveChat((prev: any) => ({
          ...prev,
          messages: [...(prev?.messages || []), message]
        }))
      }
    })
    return () => { socketRef.current?.disconnect() }
  }, [])

  useEffect(() => { fetchData(activeTab) }, [activeTab])

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
      showToast(t('support_page.failed_load'), 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptChat = async (id: string) => {
    try {
      const res = await psychSupportService.acceptChat(id)
      socketRef.current?.emit('join_chat', id)
      setActiveChat({ ...res.data, messages: [] })
      fetchData('chat')
      showToast(t('support_page.chat_accepted'))
    } catch {
      showToast(t('support_page.failed_accept'), 'error')
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatMessage.trim() || !activeChat) return
    const content = chatMessage.trim()
    setChatMessage('')
    const msgData = {
      sessionId: activeChat.id,
      senderId: user?.userId,
      content,
      createdAt: new Date().toISOString()
    }
    // Show immediately (optimistic)
    setActiveChat((prev: any) => ({ ...prev, messages: [...(prev.messages || []), msgData] }))
    try {
      socketRef.current?.emit('send_message', msgData)
      await psychSupportService.sendMessage(activeChat.id, content)
    } catch {
      showToast(t('support_page.message_failed'), 'error')
    }
  }

  const handleEndChat = async () => {
    if (!activeChat || !endMood.trim()) return
    try {
      await psychSupportService.endChat(activeChat.id, endMood)
      setActiveChat(null)
      setEndMood('')
      setShowEndModal(false)
      fetchData('chat')
      showToast(t('support_page.session_ended'))
    } catch {
      showToast(t('support_page.failed_end'), 'error')
    }
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget as HTMLFormElement)
    const data = {
      title: fd.get('title'),
      description: fd.get('description'),
      scheduledFor: fd.get('scheduledFor'),
      maxParticipants: parseInt(fd.get('maxParticipants') as string),
      counselorId: user?.userId,
      campId: 'Camp-Primary'
    }
    try {
      await psychSupportService.createGroup(data)
      setShowGroupModal(false)
      fetchData('groups')
      showToast(t('support_page.group_scheduled'))
    } catch {
      showToast(t('support_page.failed_create'), 'error')
    }
  }

  const handleJoinGroup = async (id: string) => {
    try {
      await psychSupportService.joinGroup(id)
      fetchData('groups')
      showToast(t('support_page.registered_participant'))
    } catch {
      showToast(t('support_page.failed_join'), 'error')
    }
  }

  const handleUpdateCheckIn = async (id: string, status: string) => {
    try {
      const nextDate = status === 'COMPLETED' ? null : new Date(Date.now() + 86400000 * 7).toISOString()
      await psychSupportService.updateCheckIn(id, status, nextDate)
      fetchData('checkins')
      showToast(status === 'COMPLETED' ? t('support_page.checkin_complete') : t('support_page.checkin_escalated'))
    } catch {
      showToast(t('support_page.failed_checkin'), 'error')
    }
  }

  const maxBarValue = dashboardData?.requestsByDay
    ? Math.max(...dashboardData.requestsByDay.map((d: any) => d.requests), 1)
    : 1

  const TABS = [
    { key: 'chat', label: t('support_page.tabs.chat'), icon: MessageSquare },
    { key: 'groups', label: t('support_page.tabs.groups'), icon: Users },
    { key: 'guides', label: t('support_page.tabs.guides'), icon: BookOpen },
    { key: 'dashboard', label: t('support_page.tabs.dashboard'), icon: Activity },
    { key: 'checkins', label: t('support_page.tabs.checkins'), icon: UserCheck },
  ]

  if (user?.role === 'CITIZEN' || user?.role === 'VOLUNTEER') {
    return <CitizenSupportView />
  }

  return (
    <>
      <PageMeta title="Support | Suraksha" description="Suraksha Support Page" />
      <PageBreadcrumb pageTitle={t('support_page.title')} />
      <div className="space-y-8 animate-in fade-in duration-700 pb-10 w-full min-w-0">

        {/* Hero header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] rounded-[2.5rem] p-10 text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-48 -mt-48" />
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 mb-4">
                <HeartPulse className="w-4 h-4 text-pink-300" /> {t('support_page.psych_ops_center')}
              </div>
              <h1 className="text-3xl font-black tracking-tight leading-tight">{t('support_page.title')}</h1>
              <p className="text-indigo-100 text-sm mt-2 font-medium max-w-xl leading-relaxed">
                {t('support_page.subtitle')}
              </p>
            </div>
            {activeTab === 'groups' && (
              <button onClick={() => setShowGroupModal(true)} className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-bold shadow-lg flex items-center gap-2 hover:scale-105 transition-transform shrink-0">
                <Plus className="w-5 h-5" /> {t('support_page.schedule_group')}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 bg-slate-100 dark:bg-[#131f33] p-2 rounded-2xl border border-slate-200 dark:border-cyan-400/10">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all',
                activeTab === tab.key ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-200'
              )}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-400" /></div>
        ) : (
          <>
            {/* TAB 1: LIVE CHAT QUEUE */}
            {activeTab === 'chat' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Queue */}
                <div className="space-y-4">
                  <h3 className="text-base font-black text-slate-800 dark:text-white/90 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-400" /> {t('support_page.waiting_queue')}
                  </h3>
                  {chatSessions.filter(s => s.status === 'WAITING').length === 0 ? (
                    <div className="bg-slate-50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl p-6 text-center text-slate-500 font-bold">
                      {t('support_page.no_waiting')}
                    </div>
                  ) : (
                    chatSessions.filter(s => s.status === 'WAITING').map(session => (
                      <div key={session.id} className="suraksha-card p-5 rounded-2xl">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{t('support_page.anonymous_user')}</span>
                          <span className="text-[10px] font-black text-orange-400 bg-orange-500/15 border border-orange-500/30 px-2 py-1 rounded-full">{t('support_page.waiting')}</span>
                        </div>
                        <p className="text-xs text-slate-500 mb-4">{t('support_page.requested_ago', { time: formatDistanceToNow(new Date(session.startedAt)) })}</p>
                        <button
                          onClick={() => handleAcceptChat(session.id)}
                          className="w-full py-2.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 font-bold rounded-xl text-sm hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all"
                        >
                          {t('support_page.accept_chat')}
                        </button>
                      </div>
                    ))
                  )}

                  {/* Active sessions list */}
                  {chatSessions.filter(s => s.status === 'ACTIVE').length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">{t('support_page.active_sessions_label')}</h4>
                      {chatSessions.filter(s => s.status === 'ACTIVE').map(s => (
                        <div key={s.id} className="flex items-center gap-2 text-xs text-slate-400 font-bold bg-green-500/8 border border-green-500/20 px-4 py-2.5 rounded-xl mb-2">
                          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
                          {t('support_page.session_in_progress')}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Chat Window */}
                <div className="lg:col-span-2">
                  {activeChat ? (
                    <div className="bg-white dark:bg-[#131f33] border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden flex flex-col h-[580px] shadow-2xl">
                      <div className="px-5 py-4 bg-indigo-600 flex justify-between items-center shrink-0">
                        <div>
                          <h3 className="font-black text-white flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> {t('support_page.active_session')}
                          </h3>
                          <p className="text-[10px] text-indigo-200 font-mono">ID: {activeChat.id?.slice(0, 16)}...</p>
                        </div>
                        <button
                          onClick={() => setShowEndModal(true)}
                          className="bg-white/15 hover:bg-white/25 px-4 py-2 rounded-lg text-xs font-bold text-white transition-colors"
                        >
                          {t('support_page.end_session')}
                        </button>
                      </div>
                      <div className="flex-1 p-5 overflow-y-auto bg-slate-100 dark:bg-[#0a1628] flex flex-col gap-3">
                        <div className="text-center text-[10px] font-black text-slate-500 dark:text-slate-600 uppercase tracking-widest bg-white dark:bg-white/5 py-1.5 rounded-full w-max mx-auto px-5 border border-slate-200 dark:border-transparent">{t('support_page.session_started')}</div>
                        {(activeChat.messages || []).map((msg: any, i: number) => {
                          const isMe = msg.senderId === user?.userId
                          return (
                            <div key={i} className={cn('max-w-[80%] rounded-2xl p-4', isMe ? 'bg-indigo-600 text-white self-end rounded-tr-sm' : 'bg-white dark:bg-white/8 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 self-start rounded-tl-sm')}>
                              <p className="text-sm font-medium">{msg.content}</p>
                              <span className={cn('text-[10px] mt-1 block opacity-60', isMe ? 'text-right' : '')}>
                                {new Date(msg.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                          )
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                      <form onSubmit={handleSendMessage} className="p-4 bg-slate-50 dark:bg-[#131f33] border-t border-slate-200 dark:border-white/10 flex gap-2 shrink-0">
                        <input
                          type="text"
                          placeholder={t('support_page.chat_placeholder')}
                          className="suraksha-input flex-1 py-2.5 text-sm"
                          value={chatMessage}
                          onChange={e => setChatMessage(e.target.value)}
                        />
                        <button type="submit" disabled={!chatMessage.trim()} className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-500 disabled:opacity-40 transition-colors">
                          <Send className="w-5 h-5" />
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="bg-slate-50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10 rounded-3xl h-[580px] flex flex-col items-center justify-center text-center p-10">
                      <MessageSquare className="w-16 h-16 mb-4 text-slate-400 dark:text-slate-700" />
                      <h3 className="text-lg font-black text-slate-500 dark:text-white/50 mb-2">{t('support_page.no_active_session')}</h3>
                      <p className="text-sm text-slate-500 font-medium max-w-xs">{t('support_page.accept_from_queue')}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: GROUP THERAPY */}
            {activeTab === 'groups' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupSessions.length === 0 ? (
                  <div className="col-span-full py-20 text-center bg-slate-50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10 rounded-3xl text-slate-500 font-bold">
                    {t('support_page.no_groups')}
                  </div>
                ) : groupSessions.map(session => (
                  <div key={session.id} className="suraksha-card rounded-3xl p-6 hover:shadow-xl transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-black text-slate-800 dark:text-white/90 text-lg leading-tight">{session.title}</h3>
                      <span className="px-2.5 py-1 bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded-full text-[10px] font-black uppercase shrink-0 ml-2">{session.status}</span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 line-clamp-3">{session.description}</p>
                    <div className="space-y-2 mb-5">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                        <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                        {new Date(session.scheduledFor).toLocaleString()}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                        <Users className="w-4 h-4 text-indigo-400 shrink-0" />
                        {t('support_page.registered_count', { count: session.participants?.length || 0, max: session.maxParticipants })}
                      </div>
                    </div>
                    <button
                      onClick={() => handleJoinGroup(session.id)}
                      disabled={session.participants?.some((p: any) => p.userId === user?.userId)}
                      className="w-full py-3 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 font-bold rounded-xl text-sm hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {session.participants?.some((p: any) => p.userId === user?.userId) ? t('support_page.already_registered') : t('support_page.register_participant')}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3: FIRST AID GUIDES */}
            {activeTab === 'guides' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {guides.length === 0 ? (
                  <div className="col-span-full py-20 text-center bg-slate-50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10 rounded-3xl text-slate-500 font-bold">{t('support_page.no_guides')}</div>
                ) : guides.map(guide => (
                  <div key={guide.id} className="suraksha-card rounded-3xl p-8">
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {guide.tags.split(',').map((tag: string, i: number) => (
                        <span key={i} className="px-2.5 py-1 bg-slate-100 dark:bg-white/8 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 rounded-full text-[10px] font-black uppercase">{tag.trim()}</span>
                      ))}
                    </div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white/90 mb-4">{guide.title}</h3>
                    <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{guide.content}</div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 4: TREND DASHBOARD */}
            {activeTab === 'dashboard' && dashboardData && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Utilization */}
                  <div className="suraksha-card p-6 rounded-3xl flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-indigo-500/15 rounded-full flex items-center justify-center mb-4">
                      <Activity className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div className="text-4xl font-black text-slate-800 dark:text-white/90">{dashboardData.utilizationRate}%</div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{t('support_page.counselor_utilization')}</div>
                  </div>

                  {/* Top issues */}
                  <div className="md:col-span-2 suraksha-card p-6 rounded-3xl">
                    <h3 className="font-black text-slate-800 dark:text-white/90 mb-5 uppercase text-xs tracking-widest">{t('support_page.top_issues')}</h3>
                    <div className="space-y-4">
                      {dashboardData.topIssues.map((issue: any, i: number) => (
                        <div key={i}>
                          <div className="flex justify-between text-sm font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                            <span>{issue.issue}</span>
                            <span className="text-slate-500">{issue.count} {t('support_page.cases')}</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-white/5 rounded-full h-2">
                            <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${(issue.count / Math.max(...dashboardData.topIssues.map((x: any) => x.count), 1)) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bar chart */}
                <div className="suraksha-card p-6 rounded-3xl">
                  <h3 className="font-black text-slate-800 dark:text-white/90 mb-6 uppercase text-xs tracking-widest">{t('support_page.weekly_requests')}</h3>
                  <div className="flex items-end gap-3 h-44">
                    {dashboardData.requestsByDay.map((day: any, i: number) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full">
                        <div className="flex-1 w-full flex items-end relative group">
                          <div
                            className="w-full bg-indigo-500 rounded-t-lg transition-all group-hover:bg-indigo-400 min-h-[4px]"
                            style={{ height: `${Math.max((day.requests / maxBarValue) * 100, 3)}%` }}
                          />
                          <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-indigo-300 opacity-0 group-hover:opacity-100 whitespace-nowrap">{day.requests}</span>
                        </div>
                        <span className="text-[10px] font-black text-slate-500 uppercase">{day.day}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: CHECK-INS */}
            {activeTab === 'checkins' && (
              <div className="suraksha-card rounded-3xl overflow-hidden min-w-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-[#0e1d36] border-b border-slate-200 dark:border-white/10 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                      <tr>
                        <th className="px-6 py-4">{t('support_page.survivor')}</th>
                        <th className="px-6 py-4">{t('support_page.type')}</th>
                        <th className="px-6 py-4">{t('support_page.scheduled_for')}</th>
                        <th className="px-6 py-4">{t('support_page.status')}</th>
                        <th className="px-6 py-4 text-right">{t('support_page.actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {checkIns.length === 0 ? (
                        <tr><td colSpan={5} className="px-6 py-16 text-center text-slate-500 font-bold">{t('support_page.no_checkins')}</td></tr>
                      ) : checkIns.map(ci => (
                        <tr key={ci.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-800 dark:text-white/90">{ci.user?.name || t('support_page.anonymous_user')}</td>
                          <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{ci.type}</td>
                          <td className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">{new Date(ci.nextCheckInDate).toLocaleDateString()}</td>
                          <td className="px-6 py-4">
                            <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-black uppercase border',
                              ci.checkInStatus === 'OVERDUE'
                                ? 'bg-red-500/15 text-red-400 border-red-500/30'
                                : 'bg-orange-500/15 text-orange-400 border-orange-500/30'
                            )}>
                              {ci.checkInStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button onClick={() => handleUpdateCheckIn(ci.id, 'COMPLETED')} className="px-3 py-1.5 bg-green-500/15 text-green-400 border border-green-500/30 text-xs font-bold rounded-lg hover:bg-green-500/25 transition-colors">{t('support_page.done')}</button>
                            <button onClick={() => handleUpdateCheckIn(ci.id, 'ESCALATED')} className="px-3 py-1.5 bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-bold rounded-lg hover:bg-red-500/25 transition-colors">{t('support_page.escalate')}</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* End Session Modal */}
        {showEndModal && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md" onClick={() => setShowEndModal(false)}>
            <div className="bg-white dark:bg-[#131f33] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="px-8 py-6 bg-slate-100 dark:bg-[#0e1d36] border-b-2 border-slate-200 dark:border-white/10 flex justify-between items-center">
                <h2 className="text-lg font-black text-slate-800 dark:text-white/90">{t('support_page.end_session_title')}</h2>
                <button onClick={() => setShowEndModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/8 text-slate-400 hover:bg-white/15 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-8 space-y-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('support_page.end_session_desc')}</p>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('support_page.mood_label')}</label>
                  <input
                    type="text"
                    value={endMood}
                    onChange={e => setEndMood(e.target.value)}
                    placeholder={t('support_page.mood_placeholder')}
                    className="suraksha-input w-full"
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleEndChat}
                  disabled={!endMood.trim()}
                  className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 disabled:opacity-40 transition-colors"
                >
                  {t('support_page.end_log')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Group Modal */}
        {showGroupModal && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md" onClick={() => setShowGroupModal(false)}>
            <div className="bg-white dark:bg-[#131f33] border border-slate-200 dark:border-white/10 w-full max-w-lg rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="px-8 py-6 bg-slate-100 dark:bg-[#0e1d36] border-b-2 border-slate-200 dark:border-white/10 flex justify-between items-center">
                <h2 className="text-lg font-black text-slate-800 dark:text-white/90">{t('support_page.schedule_title')}</h2>
                <button onClick={() => setShowGroupModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/8 text-slate-400 hover:bg-white/15 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleCreateGroup} className="p-8 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('support_page.session_title_label')}</label>
                  <input name="title" required className="suraksha-input w-full" placeholder={t('support_page.session_title_placeholder')} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('support_page.date_time')}</label>
                  <input type="datetime-local" name="scheduledFor" required className="suraksha-input w-full" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('support_page.max_participants')}</label>
                  <input type="number" name="maxParticipants" defaultValue={15} required className="suraksha-input w-full" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('support_page.description')}</label>
                  <textarea name="description" required rows={3} className="suraksha-input w-full resize-none" />
                </div>
                <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20">
                  {t('support_page.create_session')}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className={cn(
            'fixed bottom-8 right-8 z-[9999999] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-8 duration-300',
            toast.type === 'success' ? 'bg-white dark:bg-[#131f33] text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-lg' :
            toast.type === 'error' ? 'bg-white dark:bg-[#131f33] text-red-600 dark:text-red-400 border border-red-500/30 shadow-lg' :
            'bg-white dark:bg-[#131f33] text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-lg'
          )}>
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            <span className="font-bold text-sm">{toast.message}</span>
          </div>
        )}
      </div>
    </>
  )
}
