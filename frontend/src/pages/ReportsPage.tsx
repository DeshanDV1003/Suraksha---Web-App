import { useMemo, useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import {
  Download, TrendingUp, TrendingDown,
  Users, Heart, Baby, Accessibility,
  PawPrint, Box, Building2, Zap, Brain, Send, Stethoscope, AlertCircle,
  Radio
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { analyticsService } from '../services/api'
import { useTranslation } from 'react-i18next'

export default function ReportsPage() {
  const { t } = useTranslation()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleExport = () => {
    if (!data) return
    const exportData = {
      timestamp: new Date().toISOString(),
      stats: data,
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
        const res = await analyticsService.getOperationalIntelligence()
        setData(res.data)
      } catch (err) {
        console.error('Failed to fetch stats', err)
        setError('Operational Intelligence Sync Failed')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-[#0061ff] rounded-full animate-spin" />
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Downloading Global Analytics Matrix...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="suraksha-card p-20 flex flex-col items-center text-center gap-6">
        <div className="w-20 h-20 bg-red-50 rounded-[2.5rem] flex items-center justify-center text-red-500">
          <AlertCircle className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-[#1e293b]">Telemetry Disconnected</h2>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest leading-loose">The command center is unable to reach the global reporting node. <br />Checking satellite link integrity...</p>
        </div>
        <button onClick={() => window.location.reload()} className="suraksha-button px-10">Retry Sync</button>
      </div>
    )
  }

  const kpis = [
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
    { label: 'Total', value: data.specialNeeds.total, icon: Users, color: 'text-slate-600', bg: 'bg-slate-50' },
  ]

  const ML_STATS = [
    { label: 'Precision', value: data.mlStats.precision, sub: 'Flood Detection', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Recall', value: data.mlStats.recall, sub: 'Object Identify', color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'F1 Score', value: data.mlStats.f1Score, sub: 'Threat Assessment', color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Latency', value: data.mlStats.latency, sub: 'Visual Nodes', color: 'text-orange-600', bg: 'bg-orange-50' },
  ]

  return (
    <div className="space-y-10 animate-in fade-in duration-700 font-sans pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1e293b]">Operational Intelligence</h1>
          <p className="text-slate-500 mt-1 font-medium">Real-time Command Hub Sector Analytics</p>
        </div>
        <button
          onClick={handleExport}
          className="suraksha-button flex items-center gap-3 px-8 h-14 bg-slate-900 shadow-xl shadow-slate-900/10"
        >
          <Download className="w-5 h-5 text-blue-400" />
          <span className="uppercase tracking-widest text-[11px] font-black">Export Intelligence Briefing</span>
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {kpis.map((kpi, i) => (
          <div key={i} className="suraksha-card p-10 bg-white hover:border-blue-100 transition-all group overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#0061ff]/5 rounded-full blur-3xl group-hover:bg-[#0061ff]/10 transition-colors" />
            <div className="flex items-center justify-between mb-10 relative z-10">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{kpi.label}</span>
              <div className={cn(
                "flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-full",
                kpi.isUp ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
              )}>
                {kpi.isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {kpi.trend}
              </div>
            </div>
            <div className="text-5xl font-black text-[#1e293b] tracking-tighter relative z-10">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Distribution Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="suraksha-card p-12 space-y-10 bg-white">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
            <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-[#0061ff]">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black text-[#1e293b]">Citizen Status Matrix</h3>
          </div>

          <div className="space-y-8">
            {[
              { label: 'Verified Safe', val: `${data.citizenStatus.verifiedSafe.value} (${data.citizenStatus.verifiedSafe.percent}%)`, color: 'text-green-500', barColor: 'bg-green-500', percent: data.citizenStatus.verifiedSafe.percent },
              { label: 'Critical Response', val: `${data.citizenStatus.criticalResponse.value} (${data.citizenStatus.criticalResponse.percent}%)`, color: 'text-red-500', barColor: 'bg-red-500', percent: data.citizenStatus.criticalResponse.percent },
              { label: 'Location Tracking', val: `${data.citizenStatus.locationTracking.value} (${data.citizenStatus.locationTracking.percent}%)`, color: 'text-orange-500', barColor: 'bg-orange-500', percent: data.citizenStatus.locationTracking.percent },
              { label: 'In-Transit to Camp', val: `${data.citizenStatus.inTransit.value} (${data.citizenStatus.inTransit.percent}%)`, color: 'text-blue-500', barColor: 'bg-blue-500', percent: data.citizenStatus.inTransit.percent },
            ].map((item, i) => (
              <div key={i} className="space-y-4">
                <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-widest pl-1">
                  <span className="text-slate-400">{item.label}</span>
                  <span className={cn("font-black", item.color)}>{item.val}</span>
                </div>
                <div className="h-3 w-full bg-slate-50 border border-slate-100/50 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all duration-1000", item.barColor)} style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="suraksha-card p-12 space-y-10 bg-white">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
            <div className="w-10 h-10 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
              <Box className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black text-[#1e293b]">Field Inventory</h3>
          </div>
          <div className="space-y-8 flex-1">
            {[
              { label: 'Rescue Boats', value: data.fieldInventory.rescueBoats, icon: Send, color: 'text-blue-600', rotate: true },
              { label: 'Logistics Vehicles', value: data.fieldInventory.logisticsVehicles, icon: Box, color: 'text-green-600' },
              { label: 'Power Nodes', value: data.fieldInventory.powerNodes, icon: Zap, color: 'text-orange-500' },
              { label: 'Shelter Hubs', value: data.fieldInventory.shelterHubs, icon: Building2, color: 'text-purple-600' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between group cursor-default">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-[1.25rem] bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-white group-hover:shadow-xl group-hover:shadow-slate-200/50 transition-all">
                    <item.icon className={cn("w-6 h-6", item.color, item.rotate && "rotate-[30deg]")} />
                  </div>
                  <span className="text-[13px] font-black text-slate-500 uppercase tracking-widest group-hover:text-[#1e293b] transition-colors">{item.label}</span>
                </div>
                <span className="text-3xl font-black text-[#1e293b]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="suraksha-card p-12 space-y-10 bg-[#1e293b] text-white">
          <h3 className="text-xl font-black uppercase tracking-widest text-[#0061ff]">Crisis Fund Meter</h3>
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

      <div className="suraksha-card p-10 space-y-10 bg-white">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-[#0061ff]" />
          <h3 className="text-2xl font-black text-[#1e293b]">High-Intensity Cases</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-8">
          {specialNeedsItems.map((item, i) => (
            <div key={i} className={cn("p-10 rounded-[3rem] flex flex-col items-center text-center gap-4 group hover:scale-[1.05] hover:shadow-2xl transition-all cursor-default border-2 border-transparent", item.bg, "hover:border-white/50")}>
              <div className="p-4 bg-white rounded-3xl shadow-sm">
                <item.icon className={cn("w-8 h-8", item.color)} />
              </div>
              <div className={cn("text-4xl font-black tracking-tighter", item.color)}>{item.value}</div>
              <div className={cn("text-[10px] font-black uppercase tracking-widest opacity-60", item.color)}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Incident Frequency */}
        <div className="suraksha-card p-12 bg-white min-h-[500px] flex flex-col">
          <div className="flex items-center justify-between mb-16">
            <h3 className="text-xl font-black text-[#1e293b] uppercase tracking-tighter">Frequency Timeline</h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">7-Day Analysis</span>
          </div>
          <div className="flex-1 h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.weeklyTrends}>
                <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#f8fafc" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                  dy={20}
                />
                <YAxis hide domain={[0, 25]} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} content={<CustomTooltip />} />
                <Bar
                  dataKey="value"
                  fill="#0061ff"
                  radius={[12, 12, 0, 0]}
                  barSize={40}
                  isAnimationActive={true}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="suraksha-card p-12 bg-white min-h-[500px] flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-16">
            <h3 className="text-xl font-black text-[#1e293b] uppercase tracking-tighter">Priority Matrix</h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sector Concentration</span>
          </div>

          <div className="relative w-full h-[320px] mb-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dynamicPriorityData.some(d => d.value > 0) ? dynamicPriorityData : [{ name: 'Empty', value: 1, color: '#f1f5f9' }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={100}
                  outerRadius={140}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {dynamicPriorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="text-6xl font-black text-[#1e293b] tracking-tighter">{data.incidents.total}</div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">Total Dossiers</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-16 gap-y-6 w-full px-10">
            {dynamicPriorityData.map((item) => (
              <div key={item.name} className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: item.color }} />
                <div className="flex flex-col">
                  <span className="text-[12px] font-black text-[#1e293b] leading-none uppercase tracking-tighter">{item.name}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{item.value} Reports</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ML Performance Row */}
      <div className="suraksha-card p-12 space-y-10 bg-white">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-[#1e293b] uppercase tracking-tighter">AI Node Health Matrix</h3>
          <div className="flex items-center gap-2 text-[9px] font-black text-green-500 uppercase tracking-[0.2em] bg-green-50 px-4 py-1.5 rounded-full">
            <Radio className="w-3 h-3" />
            Processing Live Visual Feed
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {ML_STATS.map((card, i) => (
            <div key={i} className={cn("p-10 rounded-[2.5rem] flex flex-col items-center text-center transition-all hover:scale-[1.05] hover:shadow-xl cursor-default border-none", card.bg)}>
              <div className={cn("text-5xl font-black mb-4 tracking-tighter", card.color)}>{card.value}</div>
              <div className="text-[13px] font-black text-slate-700 uppercase tracking-widest opacity-80">{card.label}</div>
              <div className="text-[10px] font-bold text-slate-400 mt-2 uppercase italic">{card.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1e293b] px-6 py-3 rounded-2xl shadow-2xl border border-white/10 flex flex-col items-center">
        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Reports</span>
        <span className="text-xl font-black text-white">{payload[0].value}</span>
      </div>
    )
  }
  return null
}
