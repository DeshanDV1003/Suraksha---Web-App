import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2, Bot, User, AlertTriangle } from 'lucide-react'
import axios from 'axios'

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/chatbot/message`

interface Message {
  role: 'user' | 'model'
  text: string
}

const WELCOME = `Hi! I'm Suraksha Assistant 🤝

I can help you with:
• **Medical guidance** — describe your symptoms and I'll suggest home remedies
• **Nearest relief camps** — based on your location
• **Flood safety** — what to do, where to go
• **First aid steps** — for injuries and emergencies

How can I help you right now?`

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: WELCOME },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('suraksha_user_location')
    if (saved) {
      try { setUserCoords(JSON.parse(saved)) } catch { /* ignore */ }
    } else {
      navigator.geolocation?.getCurrentPosition(
        p => setUserCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      )
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  const buildHistory = (msgs: Message[]) =>
    msgs.slice(1).map(m => ({
      role: m.role,
      parts: [{ text: m.text }],
    }))

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { role: 'user', text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const { data } = await axios.post(API, {
        message: text,
        history: buildHistory(messages),
        lat: userCoords?.lat,
        lng: userCoords?.lng,
      })
      setMessages(prev => [...prev, { role: 'model', text: data.reply }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'model',
        text: 'Sorry, I could not connect right now. Please try again in a moment.',
      }])
    } finally {
      setLoading(false)
    }
  }

  const formatText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .split('\n')
      .map(line => line.startsWith('•') || line.startsWith('-')
        ? `<span style="display:block;padding-left:12px">${line}</span>`
        : `<span style="display:block">${line}</span>`
      )
      .join('')
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full bg-cyan-500 hover:bg-cyan-400 text-white shadow-2xl flex items-center justify-center transition-all hover:scale-105"
        title="Suraksha Assistant"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-gray-900" />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-[9998] w-[360px] max-h-[560px] flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-cyan-400/20 bg-white dark:bg-[#0f172a]">

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-[#131f33] border-b border-gray-200 dark:border-cyan-400/20">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center">
              <Bot className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
            </div>
            <div>
              <p className="text-sm font-black text-gray-800 dark:text-white/90">Suraksha Assistant</p>
              <p className="text-[10px] text-green-600 dark:text-green-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400 inline-block" /> Online · AI powered
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-[#0f172a]" style={{ maxHeight: 400 }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-blue-100 dark:bg-blue-500/20' : 'bg-cyan-100 dark:bg-cyan-500/20'}`}>
                  {msg.role === 'user'
                    ? <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    : <Bot className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />}
                </div>
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-white dark:bg-[#1e293b] text-gray-700 dark:text-gray-100 rounded-tl-sm border border-gray-200 dark:border-white/5'
                  }`}
                  dangerouslySetInnerHTML={{ __html: formatText(msg.text) }}
                />
              </div>
            ))}

            {loading && (
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-cyan-100 dark:bg-cyan-500/20 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-white/5 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-bold">Thinking…</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Emergency note */}
          <div className="px-4 py-1.5 bg-red-50 dark:bg-red-500/10 border-t border-red-200 dark:border-red-500/20 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-red-500 dark:text-red-400 flex-shrink-0" />
            <p className="text-[10px] text-red-600 dark:text-red-400 font-bold">Life emergency? Call 1990 immediately</p>
          </div>

          {/* Input */}
          <div className="px-3 py-3 bg-gray-50 dark:bg-[#131f33] border-t border-gray-200 dark:border-cyan-400/20 flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Describe your symptom or question…"
              className="flex-1 bg-white dark:bg-[#0f172a] border border-gray-300 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-cyan-400"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
