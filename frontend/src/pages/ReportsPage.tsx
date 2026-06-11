import { useMemo, useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'
import {
  Download, TrendingUp, TrendingDown,
  Users, Heart, Baby, Accessibility,
  PawPrint, Box, Building2, Zap, Brain, Send, Stethoscope, AlertCircle,
  Radio, FileText, CheckCircle, Activity, MapPin, DollarSign
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { analyticsService } from '../services/api'
import { useTranslation } from 'react-i18next'
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";

export default function ReportsPage() {
  const { t } = useTranslation()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // AAR State
  const [aarIncidentId, setAarIncidentId] = useState('')
  const [aarGenerating, setAarGenerating] = useState(false)
  const [aarData, setAarData] = useState<any>(null)
  
  // Vulnerability & KPIs State
  const [kpis, setKpis] = useState<any[]>([])
  const [vulnerability, setVulnerability] = useState<any[]>([])
  const [budgets, setBudgets] = useState<any[]>([])

  const handleExport = () => {
    if (!data) return
    const exportData = {
      timestamp: new Date().toISOString(),
      stats: data,
      vulnerability,
      kpis,
      budgets
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `suraksha-intelligence-${new Date().getTime()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [res, kpiRes, vulnRes, budgetRes] = await Promise.all([
          analyticsService.getOperationalIntelligence(),
          analyticsService.getKPIBenchmarks('2026-06'),
          analyticsService.getVulnerabilityIndex(),
          analyticsService.getDisasterBudgets()
        ])
        setData(res.data)
        setKpis(kpiRes.data)
        setVulnerability(vulnRes.data)
        setBudgets(budgetRes.data)
      } catch (err) {
        console.error('Failed to fetch stats', err)
        setError('Operational Intelligence Sync Failed')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const handleGenerateAAR = async () => {
    if (!aarIncidentId) return;
    setAarGenerating(true);
    try {
      const res = await analyticsService.generateAAR(aarIncidentId);
      setAarData(res.data);
    } catch (err) {
      alert("Failed to generate AAR. Make sure Incident ID is valid.");
    } finally {
      setAarGenerating(false);
    }
  }

  const dynamicPriorityData = useMemo(() => {
    if (!data) return []
    return [
      { name: 'Critical', value: data.incidents.critical, color: '#ef4444' },
      { name: 'High', value: data.incidents.high, color: '#f97316' },
      { name: 'Medium', value: data.incidents.medium, color: '#eab308' },
      { name: 'Low', value: data.incidents.low, color: '#94a3b8' },
    ]
  }, [data])

  if (loading || !data) {
    return (
          <>
            <PageMeta title="Reports | Suraksha" description="Suraksha Reports Page" />
            <PageBreadcrumb pageTitle="Reports" />
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 border-4 border-blue-100 border-t-[#0061ff] rounded-full animate-spin" />
            <p className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em]">Downloading Global Analytics Matrix...</p>
          </div>
          </>
        )
  }

  if (error) {
    return (
      <div className="suraksha-card p-20 flex flex-col items-center text-center gap-6">
        <div className="w-20 h-20 bg-red-50 rounded-[2.5rem] flex items-center justify-center text-red-500">
          <AlertCircle className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-gray-800 dark:text-white/90">Telemetry Disconnected</h2>
          <p className="text-gray-400 dark:text-gray-500 text-sm font-bold uppercase tracking-widest leading-loose">The command center is unable to reach the global reporting node. <br />Checking satellite link integrity...</p>
        </div>
        <button onClick={() => window.location.reload()} className="suraksha-button px-10">Retry Sync</button>
      </div>
    )
  }

  const topKpis = [
    { label: 'Total Incidents', value: data.incidents.total.toString(), trend: '+12%', isUp: true },
    { label: 'Avg Response Time', value: data.kpis.avgResponseTime, trend: '-18%', isUp: false },
    { label: 'Volunteer Utilization', value: data.kpis.volunteerUtilization, trend: '+8%', isUp: true },
    { label: 'Alert Delivery Rate', value: data.kpis.alertDeliveryRate, trend: '+1.2%', isUp: true },
  ]

  const specialNeedsItems = [
    { label: 'Elderly', value: data.specialNeeds.elderly, icon: Heart, color: 'text-red-500', bg: 'bg-red-50' },
    { label: 'Infants', value: data.specialNeeds.infants, icon: Baby, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Disabled', value: data.specialNeeds.disabled, icon: Accessibility, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Pets', value: data.specialNeeds.pets, icon: PawPrint, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Chronic', value: data.specialNeeds.chronic, icon: Stethoscope, color: 'text-pink-500', bg: 'bg-pink-50' },
    { label: 'Total', value: data.specialNeeds.total, icon: Users, color: 'text-gray-600 dark:text-gray-300', bg: 'bg-gray-50 dark:bg-gray-800/50' },
  ]

  return (
    <>
      <PageMeta title="Reports | Suraksha" description="Suraksha Reports Page" />
      <PageBreadcrumb pageTitle="Reports" />
      <div className="space-y-10 animate-in fade-in duration-700 font-sans pb-20 w-full min-w-0">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-end gap-6 mb-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-3 px-8 h-14 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-95 shadow-sm group"
          >
            <Download className="w-5 h-5 text-gray-500 group-hover:text-blue-500 transition-colors" />
            <span className="uppercase tracking-widest text-[11px] font-black text-gray-700 dark:text-gray-200">Export Intelligence Briefing</span>
          </button>
        </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {topKpis.map((kpi, i) => (
          <div key={i} className="suraksha-card p-10 bg-white dark:bg-gray-900 hover:border-blue-100 transition-all group overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full blur-3xl group-hover:bg-brand-500/10 transition-colors" />
            <div className="flex items-start justify-between gap-4 mb-10 relative z-10">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 leading-relaxed">{kpi.label}</span>
              <div className={cn(
                "flex items-center shrink-0 gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-full",
                kpi.isUp ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
              )}>
                {kpi.isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {kpi.trend}
              </div>
            </div>
            <div className="text-4xl font-black text-gray-800 dark:text-white/90 tracking-tighter relative z-10">{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Resource Utilization (Bar Chart) */}
        <div className="suraksha-card p-10 space-y-10 bg-white dark:bg-gray-900 col-span-1 lg:col-span-2">
           <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
            <Activity className="w-6 h-6 text-brand-500" />
            <h3 className="text-xl font-black text-gray-800 dark:text-white/90">Resource Utilization</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.resourceUtilization || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9"/>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 700}} width={120} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="used" stackId="a" fill="#0061ff" radius={[4, 0, 0, 4]} barSize={20} />
                <Bar dataKey="available" stackId="a" fill="#cbd5e1" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Crisis Fund */}
        <div className="suraksha-card p-12 space-y-10 bg-gray-800 dark:bg-gray-900 text-white">
          <h3 className="text-xl font-black uppercase tracking-widest text-brand-500">Crisis Fund Meter</h3>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="text-5xl font-black text-white tracking-tighter mb-4">{data.crisisFund.total}</div>
            <div className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20">Citizen Micro-Donations</div>
          </div>
          <div className="space-y-6 pt-10 border-t border-white/5">
            {[
              { label: 'Active Support Nodes', value: data.crisisFund.activeNodes, color: 'text-white' },
              { label: 'Unique Contribution IDs', value: data.crisisFund.uniqueContributors, color: 'text-white' },
              { label: 'Fulfillment Efficiency', value: data.crisisFund.efficiency, color: 'text-green-400' },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest leading-none">
                <span className="text-white/40">{item.label}</span>
                <span className={cn("font-black", item.color)}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Volunteer Hours Area Chart */}
        <div className="suraksha-card p-12 bg-white dark:bg-gray-900 min-h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-16">
            <h3 className="text-xl font-black text-gray-800 dark:text-white/90 uppercase tracking-tighter">Volunteer Hours</h3>
            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">7-Day Analysis</span>
          </div>
          <div className="flex-1 h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.volunteerHours || []}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} dy={10} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="hours" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorHours)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Incident Frequency Bar Chart */}
        <div className="suraksha-card p-12 bg-white dark:bg-gray-900 min-h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-16">
            <h3 className="text-xl font-black text-gray-800 dark:text-white/90 uppercase tracking-tighter">Incident Frequency Timeline</h3>
            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">7-Day Analysis</span>
          </div>
          <div className="flex-1 h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.weeklyTrends}>
                <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} dy={20} />
                <YAxis hide domain={[0, 25]} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#0061ff" radius={[12, 12, 0, 0]} barSize={40} isAnimationActive={true} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Vulnerability Index Heatmap Table */}
        <div className="suraksha-card p-12 bg-white dark:bg-gray-900 flex flex-col">
          <div className="flex items-center gap-3 mb-10 border-b border-slate-50 pb-6">
            <MapPin className="w-6 h-6 text-orange-500" />
            <div>
              <h3 className="text-xl font-black text-gray-800 dark:text-white/90">Vulnerability Heat Index</h3>
              <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">District Level Demographic Risk Overlay</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-4">
              <div className="col-span-2">District</div>
              <div>Elderly</div>
              <div>Infants</div>
              <div className="text-right">Risk Score</div>
            </div>
            {vulnerability.map((v: any, idx: number) => (
              <div key={idx} className="grid grid-cols-5 items-center p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 hover:bg-white dark:bg-gray-900 hover:shadow-xl transition-all border border-transparent hover:border-gray-200 dark:border-gray-800">
                <div className="col-span-2 font-black text-gray-800 dark:text-white/90">{v.district}</div>
                <div className="text-gray-500 dark:text-gray-400 font-bold">{v.elderly}</div>
                <div className="text-gray-500 dark:text-gray-400 font-bold">{v.infants}</div>
                <div className="flex justify-end items-center gap-2">
                  <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", v.riskScore > 80 ? 'bg-red-500' : (v.riskScore > 60 ? 'bg-orange-500' : 'bg-green-500'))} style={{width: `${v.riskScore}%`}} />
                  </div>
                  <span className={cn("text-[11px] font-black w-8 text-right", v.riskScore > 80 ? 'text-red-500' : (v.riskScore > 60 ? 'text-orange-500' : 'text-green-500'))}>{v.riskScore}</span>
                </div>
              </div>
            ))}
            {vulnerability.length === 0 && (
              <div className="text-center p-10 text-gray-400 dark:text-gray-500 text-sm font-bold">No vulnerability data available</div>
            )}
          </div>
        </div>

        {/* Budget Tracker */}
        <div className="suraksha-card p-12 bg-white dark:bg-gray-900 flex flex-col">
          <div className="flex items-center gap-3 mb-10 border-b border-slate-50 pb-6">
            <DollarSign className="w-6 h-6 text-green-500" />
            <div>
              <h3 className="text-xl font-black text-gray-800 dark:text-white/90">Resource & Budget Tracker</h3>
              <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Disaster Response Expenditure vs Allocation</p>
            </div>
          </div>

          <div className="space-y-6">
            {budgets.length > 0 ? budgets.map((b: any, idx: number) => {
              const spent = b.expenditures?.reduce((sum: number, exp: any) => sum + exp.totalCost, 0) || 0;
              const percent = Math.min(100, Math.round((spent / b.allocatedBudget) * 100));
              return (
                <div key={idx} className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="font-black text-gray-800 dark:text-white/90">{b.eventName}</div>
                    <div className="text-[12px] font-black text-gray-500 dark:text-gray-400">LKR {spent.toLocaleString()} / <span className="text-gray-800 dark:text-white/90">LKR {b.allocatedBudget.toLocaleString()}</span></div>
                  </div>
                  <div className="h-4 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden relative">
                    <div className={cn("absolute top-0 left-0 h-full rounded-full transition-all duration-1000", percent > 90 ? 'bg-red-500' : (percent > 70 ? 'bg-orange-500' : 'bg-green-500'))} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              )
            }) : (
              <div className="p-8 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-800 text-center space-y-2">
                <div className="font-black text-gray-800 dark:text-white/90">No Active Budgets</div>
                <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase">Awaiting finance module sync</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* KPI Benchmarks RAG */}
        <div className="suraksha-card p-12 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-3 mb-10 border-b border-slate-50 pb-6">
            <CheckCircle className="w-6 h-6 text-blue-500" />
            <div>
              <h3 className="text-xl font-black text-gray-800 dark:text-white/90">KPI Benchmarks & Targets</h3>
              <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Actuals vs Targets RAG Status</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-4">
              <div className="col-span-2">Metric</div>
              <div>Target</div>
              <div className="text-right">Status</div>
            </div>
            
            <div className="grid grid-cols-4 items-center p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
              <div className="col-span-2 font-black text-gray-800 dark:text-white/90 text-sm">Response Time</div>
              <div className="text-gray-500 dark:text-gray-400 font-bold text-sm">{'< 45m'}</div>
              <div className="flex justify-end">
                <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase rounded-full">On Track</span>
              </div>
            </div>
            
             <div className="grid grid-cols-4 items-center p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
              <div className="col-span-2 font-black text-gray-800 dark:text-white/90 text-sm">Shelter Capacity</div>
              <div className="text-gray-500 dark:text-gray-400 font-bold text-sm">{'< 80%'}</div>
              <div className="flex justify-end">
                <span className="px-3 py-1 bg-orange-100 text-orange-700 text-[10px] font-black uppercase rounded-full">Warning</span>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
              <div className="col-span-2 font-black text-gray-800 dark:text-white/90 text-sm">Volunteer Deployment</div>
              <div className="text-gray-500 dark:text-gray-400 font-bold text-sm">{'> 50%'}</div>
              <div className="flex justify-end">
                <span className="px-3 py-1 bg-red-100 text-red-700 text-[10px] font-black uppercase rounded-full">Critical</span>
              </div>
            </div>
          </div>
        </div>

        {/* After Action Report Generator */}
        <div className="suraksha-card p-12 bg-white dark:bg-gray-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-6">
              <FileText className="w-6 h-6 text-purple-500" />
              <div>
                <h3 className="text-xl font-black text-gray-800 dark:text-white/90">After-Action Report (AAR)</h3>
                <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Post-Incident Automated Briefing</p>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
              Generate a comprehensive after-action report detailing timelines, resource expenditure, and post-incident analysis for any resolved event.
            </p>
            
            <div className="flex gap-4 mb-6">
              <input 
                type="text" 
                placeholder="Enter Incident ID..." 
                className="suraksha-input flex-1"
                value={aarIncidentId}
                onChange={(e) => setAarIncidentId(e.target.value)}
              />
              <button 
                onClick={handleGenerateAAR}
                disabled={!aarIncidentId || aarGenerating}
                className="suraksha-button px-8 whitespace-nowrap bg-purple-600 hover:bg-purple-700"
              >
                {aarGenerating ? 'Generating...' : 'Generate AAR'}
              </button>
            </div>
          </div>

          {aarData && (
            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-gray-200 dark:border-gray-800 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-black text-gray-800 dark:text-white/90">AAR Generated Successfully</h4>
                <button className="text-xs font-bold text-brand-500 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors flex items-center gap-2">
                  <Download className="w-3.5 h-3.5" /> PDF
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400 dark:text-gray-500 text-[10px] uppercase font-black tracking-widest block mb-1">Resolution Time</span>
                  <span className="font-bold text-gray-800 dark:text-white/90">{aarData.resolutionTime} minutes</span>
                </div>
                <div>
                  <span className="text-gray-400 dark:text-gray-500 text-[10px] uppercase font-black tracking-widest block mb-1">Cost Estimate</span>
                  <span className="font-bold text-gray-800 dark:text-white/90">LKR {aarData.costEstimate.toLocaleString()}</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-gray-200 dark:border-gray-700/50 mt-2">
                  <span className="text-gray-400 dark:text-gray-500 text-[10px] uppercase font-black tracking-widest block mb-1">Lessons Learned</span>
                  <p className="font-medium text-gray-600 dark:text-gray-300">{aarData.lessonsLearned || 'No data available'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="suraksha-card p-10 space-y-10 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-brand-500" />
          <h3 className="text-2xl font-black text-gray-800 dark:text-white/90">High-Intensity Cases Demographics</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-8">
          {specialNeedsItems.map((item, i) => (
            <div key={i} className={cn("p-10 rounded-[3rem] flex flex-col items-center text-center gap-4 group hover:scale-[1.05] hover:shadow-2xl transition-all cursor-default border-2 border-transparent", item.bg, "hover:border-white/50")}>
              <div className="p-4 bg-white dark:bg-gray-900 rounded-3xl shadow-sm">
                <item.icon className={cn("w-8 h-8", item.color)} />
              </div>
              <div className={cn("text-4xl font-black tracking-tighter", item.color)}>{item.value}</div>
              <div className={cn("text-[10px] font-black uppercase tracking-widest opacity-60", item.color)}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
    </>
  )
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 dark:bg-gray-900 px-6 py-3 rounded-2xl shadow-2xl border border-white/10 flex flex-col items-center">
        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Reports</span>
        <span className="text-xl font-black text-white">{payload[0].value}</span>
      </div>
    )
  }
  return null
}
