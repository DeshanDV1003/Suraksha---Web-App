import { useState, useEffect } from 'react'
import { QrCode, Clock, Plus, X, Search, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { tokenService, userService } from '@/services/api'
import { useAppStore } from '@/store/useAppStore'
import { formatDistanceToNow } from 'date-fns'

interface Token {
  id: string
  code: string
  type: string
  status: string
  createdAt: string
  user: {
    name: string
  }
}

export default function TokensPage() {
  const [tokens, setTokens] = useState<Token[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showGenModal, setShowGenModal] = useState(false)
  const [showValModal, setShowValModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form States
  const [selectedUserId, setSelectedUserId] = useState('')
  const [tokenType, setTokenType] = useState('RELIEF')
  const [validateCode, setValidateCode] = useState('')

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch tokens (everyone authenticated can see history, or restricted to officers?)
      const tokensRes = await tokenService.getTokens()
      setTokens(tokensRes.data)

      // Only fetch users if the current user is an admin or officer (to populate the "Issue Token" dropdown)
      const user = useAppStore.getState().user;
      if (user && (user.role === 'ADMIN' || user.role === 'DMC_OFFICER')) {
        try {
          const usersRes = await userService.getUsers()
          setUsers(usersRes.data)
        } catch (uErr) {
          console.warn('Failed to fetch users list (likely permission restricted):', uErr)
        }
      }
    } catch (error) {
      console.error('Failed to fetch token data:', error)
      alert('Failed to load token information')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleGenerateToken = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId) return alert('Please select a user')
    
    try {
      setIsSubmitting(true)
      await tokenService.createToken({ userId: selectedUserId, type: tokenType })
      alert('Token generated successfully')
      setShowGenModal(false)
      setSelectedUserId('')
      fetchData()
    } catch (error) {
      console.error('Generation failed:', error)
      alert('Failed to generate token')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleValidateToken = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateCode) return
    
    try {
      setIsSubmitting(true)
      await tokenService.useToken(validateCode)
      alert('Token validated and marked as USED')
      setShowValModal(false)
      setValidateCode('')
      fetchData()
    } catch (error: any) {
      console.error('Validation failed:', error)
      alert(error.response?.data?.message || 'Invalid or expired token')
    } finally {
      setIsSubmitting(false)
    }
  }

  const stats = [
    { label: 'Tokens Issued', value: tokens.length.toString(), color: 'text-blue-600' },
    { label: 'Active Tokens', value: tokens.filter(t => t.status === 'ACTIVE').length.toString(), color: 'text-green-600' },
    { label: 'Used Tokens', value: tokens.filter(t => t.status === 'USED').length.toString(), color: 'text-orange-600' },
    { label: 'Success Rate', value: tokens.length > 0 ? `${Math.round((tokens.filter(t => t.status === 'USED').length / tokens.length) * 100)}%` : '0%', color: 'text-purple-600' },
  ]

  const user = useAppStore(state => state.user)
  const isStaff = user?.role === 'ADMIN' || user?.role === 'DMC_OFFICER'

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#1e293b]">Digital Token System</h1>
          <p className="text-slate-500 mt-1 font-bold">QR-based fair distribution and tracking</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowValModal(true)}
            className="suraksha-button bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <Search className="w-5 h-5" />
            Validate Token
          </button>
          <button 
            onClick={() => setShowGenModal(true)}
            className="suraksha-button bg-[#0061ff] text-white shadow-lg shadow-blue-500/25"
          >
            <QrCode className="w-5 h-5" />
            Generate New Token
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="suraksha-card p-7 flex flex-col items-center justify-center text-center space-y-1 hover:shadow-lg transition-all shadow-sm">
             <div className={cn("text-3xl font-black", stat.color)}>{stat.value}</div>
             <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Distributions List Container */}
      <div className="suraksha-card p-10 space-y-8 shadow-sm rounded-[1.5rem]">
        <h3 className="text-xl font-black text-[#1e293b]">Token History</h3>
        <div className="space-y-5">
          {loading ? (
            <div className="text-center py-20 flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-slate-400 font-bold">Loading token history...</p>
            </div>
          ) : tokens.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
               <QrCode className="w-12 h-12 text-slate-300 mx-auto mb-3" />
               <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No Tokens Issued Yet</p>
            </div>
          ) : (
            tokens.map((token) => (
              <div 
                key={token.id} 
                className={cn(
                  "p-7 rounded-[1.5rem] bg-white border transition-all hover:shadow-lg relative group",
                  token.status === 'USED' ? "border-slate-100 bg-slate-50/30" : "border-blue-100/60"
                )}
              >
                {/* Status Badge */}
                <div className="absolute top-7 right-7">
                  <span className={cn(
                    "text-[10px] font-bold px-3 py-1.5 rounded-full tracking-wide uppercase",
                    token.status === 'ACTIVE' ? "bg-blue-50 text-blue-600" : 
                    token.status === 'USED' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                  )}>
                    {token.status}
                  </span>
                </div>

                {/* Card Content */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <QrCode className={cn("w-4 h-4", token.status === 'USED' ? "text-slate-300" : "text-blue-400")} />
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono">{token.code}</span>
                  </div>

                  <h4 className={cn("text-xl font-black", token.status === 'USED' ? "text-slate-400" : "text-[#1e293b]")}>{token.user.name}</h4>

                  <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                    <span className="bg-slate-100 px-2 py-0.5 rounded uppercase text-[10px]">{token.type}</span>
                    <span className="text-slate-300">•</span>
                    <span>System Generated</span>
                  </div>

                  <div className="pt-4 border-t border-slate-50 flex items-center gap-2 text-[12px] font-bold text-slate-400">
                    <Clock className="w-4 h-4 text-slate-300" />
                    <span>Issued {formatDistanceToNow(new Date(token.createdAt))} ago</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Generate Modal */}
      {showGenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-[1.5rem] shadow-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-2xl font-black text-[#1e293b]">Generate New Token</h2>
              <button onClick={() => setShowGenModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleGenerateToken} className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Select Resident / Recipient</label>
                <select 
                  required
                  className="suraksha-input"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  <option value="">Choose a person...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Allocation Type</label>
                <select 
                  className="suraksha-input"
                  value={tokenType}
                  onChange={(e) => setTokenType(e.target.value)}
                >
                  <option value="RELIEF">General Relief Package</option>
                  <option value="FOOD">Standard Food Ration</option>
                  <option value="MEDICAL">Medical Supplies</option>
                  <option value="WATER">Drinking Water (20L)</option>
                </select>
              </div>
              <div className="bg-blue-50/50 rounded-2xl p-4 flex items-start gap-3">
                 <QrCode className="w-5 h-5 text-blue-500 mt-1" />
                 <p className="text-xs text-blue-700 font-medium leading-relaxed">
                   Generating this token will create a unique QR code for the recipient. They must present this code at a distribution center for verification.
                 </p>
              </div>
              <div className="pt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setShowGenModal(false)}
                  className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-4 bg-[#0061ff] text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-500/25 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  Generate New Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Validate Modal */}
      {showValModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-bold text-[#1e293b]">Validate Delivery Token</h2>
              <button onClick={() => setShowValModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleValidateToken} className="p-8 space-y-5">
              <div className="space-y-2 text-center pb-4">
                 <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <QrCode className="w-10 h-10 text-blue-500" />
                 </div>
                 <p className="text-slate-500 text-sm font-medium">Enter the token code presented by the recipient to verify eligibility and confirm distribution.</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Token Code</label>
                <input 
                  type="text" 
                  placeholder="e.g. SRK-2024-XXXX" 
                  required
                  autoFocus
                  className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl text-xl font-mono text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all uppercase"
                  value={validateCode}
                  onChange={(e) => setValidateCode(e.target.value)}
                />
              </div>
              <div className="pt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setShowValModal(false)}
                  className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-all"
                >
                  Close
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting || !validateCode}
                  className="flex-1 px-6 py-4 bg-green-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-green-500/25 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  Verify & Complete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
