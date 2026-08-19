import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { QrCode, Clock, Plus, X, Search, CheckCircle2, AlertCircle, Loader2, BarChart2, ShieldAlert, HeartHandshake, List } from 'lucide-react'
import { cn } from '@/lib/utils'
import { reliefTokenService, userService } from '@/services/api'
import { useAppStore } from '@/store/useAppStore'
import { useAuth } from '@/hooks/useAuth'
import { formatDistanceToNow } from 'date-fns'
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";

interface Token {
  id: string
  code: string
  qrCodeData: string
  categories: string[]
  status: string
  isHouseholdBundle: boolean
  fraudRiskScore: number
  createdAt: string
  user: {
    name: string
  }
  donor?: {
    donorName: string
  }
  claims: any[]
}

export default function TokensPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const isCitizen = (user as any)?.role === 'CITIZEN'
  const [tokens, setTokens] = useState<Token[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [donors, setDonors] = useState<any[]>([])
  const [fraudAnalytics, setFraudAnalytics] = useState<any[]>([])
  
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(isCitizen ? 'scanner' : 'directory') // directory, issue, scanner, analytics, donors
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'warning'} | null>(null)
  
  // Issue Token Form
  const [issueData, setIssueData] = useState({
    userId: '',
    categories: [] as string[],
    isHouseholdBundle: false,
    householdId: '',
    donorId: '',
    maxUsage: 1
  })
  const [generatedToken, setGeneratedToken] = useState<Token | null>(null)

  // Scanner Form
  const [scanData, setScanData] = useState({
    code: '',
    itemType: '',
    quantity: 1,
    locationLat: '',
    locationLng: '',
    notes: ''
  })

  // Donor Form
  const [donorData, setDonorData] = useState({
    donorName: '',
    contributionAmount: '',
    targetCategories: [] as string[]
  })

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const tokensRes = await reliefTokenService.getTokens()
      setTokens(tokensRes.data)

      if (!isCitizen) {
        const usersRes = await userService.getUsers()
        setUsers(usersRes.data)

        const fraudRes = await reliefTokenService.getFraudAnalytics()
        setFraudAnalytics(fraudRes.data)
      }

      const donorsRes = await reliefTokenService.getDonorCampaigns()
      setDonors(donorsRes.data)
    } catch (error: any) {
      if (error?.response?.status !== 403) {
        console.error('Failed to fetch data:', error)
        showToast('Failed to load token information', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleIssueToken = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!issueData.userId) return showToast('Please select a recipient', 'error')
    if (issueData.categories.length === 0) return showToast('Select at least one category', 'error')
    
    try {
      setIsSubmitting(true)
      const res = await reliefTokenService.issueToken(issueData)
      setGeneratedToken(res.data)
      showToast('Token generated successfully', 'success')
      fetchData()
      setIssueData({ userId: '', categories: [], isHouseholdBundle: false, householdId: '', donorId: '', maxUsage: 1 })
    } catch (error) {
      showToast('Failed to generate token', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleScanToken = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scanData.code) return
    
    try {
      setIsSubmitting(true)
      const claimRes = await reliefTokenService.claimToken({
        ...scanData,
        quantity: Number(scanData.quantity),
      })
      
      showToast('Token verified and items claimed', 'success')
      setScanData({ code: '', itemType: '', quantity: 1, locationLat: '', locationLng: '', notes: '' })
      fetchData()
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Invalid or expired token'
      showToast(msg, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateDonor = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      await reliefTokenService.createDonorCampaign(donorData)
      showToast('Donor campaign created', 'success')
      setDonorData({ donorName: '', contributionAmount: '', targetCategories: [] })
      fetchData()
    } catch (error) {
      showToast('Failed to create campaign', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleCategory = (cat: string, type: 'issue' | 'donor') => {
    if (type === 'issue') {
      const cats = issueData.categories.includes(cat)
        ? issueData.categories.filter(c => c !== cat)
        : [...issueData.categories, cat]
      setIssueData({ ...issueData, categories: cats })
    } else {
      const cats = donorData.targetCategories.includes(cat)
        ? donorData.targetCategories.filter(c => c !== cat)
        : [...donorData.targetCategories, cat]
      setDonorData({ ...donorData, targetCategories: cats })
    }
  }

  const AVAILABLE_CATEGORIES = ['MEDICAL', 'FOOD', 'CLOTHING', 'SHELTER', 'TRANSPORT', 'EDUCATION', 'MENTAL_HEALTH']

  return (
        <>
          <PageMeta title="Tokens | Suraksha" description="Suraksha Tokens Page" />
          <PageBreadcrumb pageTitle={t('page_titles.tokens')} />
          <div className="space-y-8 animate-in fade-in duration-500 font-sans pb-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            
            
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto gap-2 bg-slate-100 dark:bg-[#131f33] p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-cyan-400/10">
          {[
            { id: 'directory', label: t('tokens_page.tabs.directory'), icon: List },
            ...(!isCitizen ? [{ id: 'issue', label: t('tokens_page.tabs.issue'), icon: Plus }] : []),
            { id: 'scanner', label: t('tokens_page.tabs.scanner'), icon: QrCode },
            ...(!isCitizen ? [{ id: 'analytics', label: t('tokens_page.tabs.analytics'), icon: ShieldAlert }] : []),
            { id: 'donors', label: t('tokens_page.tabs.campaigns'), icon: HeartHandshake },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap",
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

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          </div>
        )}

        {!loading && activeTab === 'directory' && (
          <div className="suraksha-card p-8 rounded-[1.5rem]">
            <h3 className="text-xl font-black text-gray-800 dark:text-white/90 mb-6">{t('tokens_page.recent_tokens')}</h3>
            <div className="space-y-4">
              {tokens.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-10">{t('tokens_page.no_tokens')}</p>
              ) : tokens.map(token => (
                <div key={token.id} className="p-6 border border-slate-200 dark:border-white/10 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-sm font-bold text-slate-500 dark:text-slate-400">{token.code}</span>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded-md tracking-wider uppercase",
                        token.status === 'ACTIVE' ? "bg-blue-500/15 text-blue-400" :
                        token.status === 'PARTIALLY_USED' ? "bg-amber-500/15 text-amber-400" :
                        "bg-white/10 text-slate-300"
                      )}>{token.status}</span>
                      {token.isHouseholdBundle && (
                         <span className="bg-purple-500/15 text-purple-400 text-[10px] font-bold px-2 py-1 rounded-md uppercase">{t('tokens_page.household_bundle')}</span>
                      )}
                    </div>
                    <h4 className="font-bold text-lg text-slate-800 dark:text-white/90">{token.user?.name || t('tokens_page.unknown_recipient')}</h4>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {token.categories.map(c => (
                        <span key={c} className="bg-slate-100 dark:bg-white/8 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-[10px] font-bold px-2 py-1 rounded-full">{c}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-400 flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(token.createdAt))} ago
                    </div>
                    {token.donor && (
                      <div className="text-xs font-bold text-emerald-400 mt-2 bg-emerald-500/15 inline-block px-2 py-1 rounded">
                        {t('tokens_page.sponsored_by')} {token.donor.donorName}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && activeTab === 'issue' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="suraksha-card p-8 rounded-[1.5rem]">
              <h3 className="text-xl font-black text-gray-800 dark:text-white/90 mb-6">{t('tokens_page.issue_new_token')}</h3>
              <form onSubmit={handleIssueToken} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">{t('tokens_page.recipient')}</label>
                  <select 
                    required
                    className="suraksha-input w-full"
                    value={issueData.userId}
                    onChange={(e) => setIssueData({...issueData, userId: e.target.value})}
                  >
                    <option value="">{t('tokens_page.select_user')}</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">{t('tokens_page.token_categories')}</label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_CATEGORIES.map(cat => (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => toggleCategory(cat, 'issue')}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-bold transition-all border",
                          issueData.categories.includes(cat)
                            ? "bg-cyan-500/30 text-cyan-300 border-cyan-400/50 shadow-md"
                            : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20 space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="bundle"
                      checked={issueData.isHouseholdBundle}
                      onChange={(e) => setIssueData({...issueData, isHouseholdBundle: e.target.checked})}
                      className="w-4 h-4 rounded text-purple-500 focus:ring-purple-500"
                    />
                    <label htmlFor="bundle" className="font-bold text-sm text-purple-300">{t('tokens_page.household_bundle_label')}</label>
                  </div>
                  {issueData.isHouseholdBundle && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-purple-400 uppercase mb-1">{t('tokens_page.max_usages')}</label>
                        <input 
                          type="number" min="1"
                          className="suraksha-input w-full py-2"
                          value={issueData.maxUsage}
                          onChange={(e) => setIssueData({...issueData, maxUsage: parseInt(e.target.value)})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-purple-400 uppercase mb-1">{t('tokens_page.household_id')}</label>
                        <input 
                          type="text"
                          className="suraksha-input w-full py-2"
                          placeholder={t('tokens_page.ref_id')}
                          value={issueData.householdId}
                          onChange={(e) => setIssueData({...issueData, householdId: e.target.value})}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">{t('tokens_page.donor_sponsorship')}</label>
                  <select 
                    className="suraksha-input w-full"
                    value={issueData.donorId}
                    onChange={(e) => setIssueData({...issueData, donorId: e.target.value})}
                  >
                    <option value="">{t('tokens_page.none')}</option>
                    {donors.map(d => <option key={d.id} value={d.id}>{d.donorName} - {d.targetCategories.join(', ')}</option>)}
                  </select>
                </div>

                <button 
                  type="submit" disabled={isSubmitting}
                  className="w-full bg-brand-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : <QrCode className="w-5 h-5"/>}
                  {t('tokens_page.generate_qr')}
                </button>
              </form>
            </div>

            {/* QR Code Display Area */}
            <div className="suraksha-card p-8 rounded-[1.5rem] flex flex-col items-center justify-center border-dashed border-2 border-slate-200 dark:border-white/10">
              {generatedToken ? (
                <div className="text-center space-y-4 animate-in zoom-in">
                  <h4 className="font-black text-xl text-green-600">{t('tokens_page.token_generated')}</h4>
                  <div className="bg-white p-4 rounded-2xl shadow-sm inline-block">
                    <img src={generatedToken.qrCodeData} alt="QR Code" className="w-48 h-48" />
                  </div>
                  <div className="font-mono font-bold text-gray-500 dark:text-gray-400">{generatedToken.code}</div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">{t('tokens_page.token_instructions')}</p>
                </div>
              ) : (
                <div className="text-center text-gray-400 dark:text-gray-500">
                  <QrCode className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="font-bold">{t('tokens_page.qr_placeholder')}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {!loading && activeTab === 'scanner' && (
          <div className="max-w-2xl mx-auto suraksha-card p-8 rounded-[1.5rem]">
             <div className="text-center mb-8">
                <div className="w-16 h-16 bg-cyan-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Search className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-2xl font-black text-gray-800 dark:text-white/90">{t('tokens_page.scanner_title')}</h3>
                
             </div>
             
             <form onSubmit={handleScanToken} className="space-y-5">
               <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">{t('tokens_page.token_code')}</label>
                  <input 
                    type="text" required autoFocus
                    placeholder="SRK-..."
                    className="suraksha-input w-full text-center text-lg font-mono tracking-widest py-4"
                    value={scanData.code}
                    onChange={(e) => setScanData({...scanData, code: e.target.value.toUpperCase()})}
                  />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">{t('tokens_page.item_type')}</label>
                    <input 
                      type="text" required
                      placeholder="e.g. Rice 5kg"
                      className="suraksha-input w-full"
                      value={scanData.itemType}
                      onChange={(e) => setScanData({...scanData, itemType: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">{t('tokens_page.quantity')}</label>
                    <input 
                      type="number" min="1" required
                      className="suraksha-input w-full"
                      value={scanData.quantity}
                      onChange={(e) => setScanData({...scanData, quantity: parseInt(e.target.value)})}
                    />
                  </div>
               </div>

               <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/20 space-y-4">
                  <h4 className="font-bold text-amber-400 flex items-center gap-2"><AlertCircle className="w-4 h-4"/> {t('tokens_page.location_data')}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number" step="any" placeholder={t('tokens_page.latitude')}
                      className="suraksha-input w-full py-2"
                      value={scanData.locationLat}
                      onChange={(e) => setScanData({...scanData, locationLat: e.target.value})}
                    />
                    <input
                      type="number" step="any" placeholder={t('tokens_page.longitude')}
                      className="suraksha-input w-full py-2"
                      value={scanData.locationLng}
                      onChange={(e) => setScanData({...scanData, locationLng: e.target.value})}
                    />
                  </div>
               </div>

               <button 
                  type="submit" disabled={isSubmitting}
                  className="w-full bg-brand-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-cyan-500/20 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : <CheckCircle2 className="w-5 h-5"/>}
                  {t('tokens_page.verify_submit')}
                </button>
             </form>
          </div>
        )}

        {!loading && activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-2xl flex items-start gap-4">
              <ShieldAlert className="w-8 h-8 text-red-400 mt-1" />
              <div>
                <h3 className="text-red-400 font-black text-lg">{t('tokens_page.fraud_dashboard')}</h3>
                <p className="text-red-400/70 text-sm mt-1">{t('tokens_page.fraud_desc')}</p>
              </div>
            </div>

            <div className="grid gap-4">
              {fraudAnalytics.length === 0 ? (
                <div className="suraksha-card p-10 text-center text-emerald-600 font-bold flex flex-col items-center">
                   <CheckCircle2 className="w-12 h-12 mb-2 opacity-50" />
                   {t('tokens_page.no_high_risk')}
                </div>
              ) : fraudAnalytics.map((token: any) => (
                <div key={token.id} className="suraksha-card p-6 border-l-4 border-l-red-500 flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="font-black text-lg text-slate-800 dark:text-white/90">{token.code}</h4>
                      <span className="bg-red-500/15 text-red-400 text-xs font-bold px-2 py-1 rounded">{t('tokens_page.risk_score')} {(token.fraudRiskScore * 100).toFixed(0)}%</span>
                    </div>
                    <p className="text-sm font-bold text-slate-400 mt-1">{t('tokens_page.user_label')} {token.user?.name}</p>
                    <div className="mt-3 text-xs text-slate-500 font-medium space-y-1">
                      <p>{t('tokens_page.total_claims')} {token.claims?.length}</p>
                      <p>{t('tokens_page.last_claim')} {token.claims?.[token.claims.length-1]?.claimedAt ? new Date(token.claims[token.claims.length-1].claimedAt).toLocaleString() : 'N/A'}</p>
                    </div>
                  </div>
                  <div className="md:text-right">
                    <button
                      onClick={() => showToast(`Token ${token.code} freeze requested — contact system admin to apply.`, 'warning')}
                      className="bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 font-bold px-4 py-2 rounded-lg text-sm transition-all"
                    >
                      {t('tokens_page.freeze_token')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && activeTab === 'donors' && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 suraksha-card p-6 rounded-[1.5rem] h-fit">
              <h3 className="text-lg font-black text-gray-800 dark:text-white/90 mb-4">{t('tokens_page.create_campaign')}</h3>
              <form onSubmit={handleCreateDonor} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('tokens_page.donor_name_org')}</label>
                  <input 
                    type="text" required
                    className="suraksha-input w-full"
                    value={donorData.donorName}
                    onChange={(e) => setDonorData({...donorData, donorName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('tokens_page.contribution')}</label>
                  <input 
                    type="number" required
                    className="suraksha-input w-full"
                    value={donorData.contributionAmount}
                    onChange={(e) => setDonorData({...donorData, contributionAmount: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">{t('tokens_page.targeted_impact')}</label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_CATEGORIES.map(cat => (
                      <button
                        type="button" key={cat}
                        onClick={() => toggleCategory(cat, 'donor')}
                        className={cn(
                          "px-2 py-1 rounded border text-[10px] font-bold transition-all",
                          donorData.targetCategories.includes(cat)
                            ? "bg-emerald-500/25 text-emerald-300 border-emerald-400/50"
                            : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="submit" disabled={isSubmitting}
                  className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4"/>}
                  {t('tokens_page.create_campaign')}
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 space-y-4">
               {donors.length === 0 ? (
                 <div className="text-center text-gray-500 dark:text-gray-400 py-10 suraksha-card rounded-2xl">{t('tokens_page.no_campaigns')}</div>
               ) : donors.map((donor: any) => (
                 <div key={donor.id} className="suraksha-card p-6 rounded-[1.5rem] flex flex-col sm:flex-row justify-between gap-4">
                   <div>
                     <h4 className="font-black text-xl text-slate-800 dark:text-white/90">{donor.donorName}</h4>
                     <p className="text-emerald-400 font-bold mb-3">LKR {donor.contributionAmount.toLocaleString()}</p>
                     <div className="flex flex-wrap gap-2">
                       {donor.targetCategories.map((c: string) => <span key={c} className="bg-emerald-500/15 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded">{c}</span>)}
                     </div>
                   </div>
                   <div className="sm:text-right flex flex-col justify-between">
                     <div className="text-slate-400 text-sm font-bold">
                       {t('tokens_page.tokens_issued')} {donor.tokens?.length || 0}
                     </div>
                     <div className="text-xs text-slate-500 mt-2 bg-slate-100 dark:bg-white/5 px-3 py-2 rounded-lg inline-block">
                       {t('tokens_page.impact')} {donor.tokens?.reduce((acc: number, t: any) => acc + (t.claims?.length || 0), 0) || 0} {t('tokens_page.successful_claims')}
                     </div>
                   </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {toast && (
          <div className={cn(
            "fixed bottom-8 right-8 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-8 duration-300 font-sans",
            toast.type === 'success' ? "bg-white dark:bg-[#131f33] text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-lg" :
            toast.type === 'error' ? "bg-white dark:bg-[#131f33] text-red-600 dark:text-red-400 border border-red-500/30 shadow-lg" :
            "bg-white dark:bg-[#131f33] text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-lg"
          )}>
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-bold text-sm tracking-wide">{toast.message}</span>
          </div>
        )}
      </div>
        </>
      )
}
