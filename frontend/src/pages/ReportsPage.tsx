import { useMemo } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts'
import { 
  Download, TrendingUp, TrendingDown,
  Users, Heart, Baby, Accessibility, 
  PawPrint, Box, Building2, Zap, Brain, Send
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ReportsPage() {
  const weeklyData = useMemo(() => [
    { name: 'Mon', value: 12 },
    { name: 'Tue', value: 15 },
    { name: 'Wed', value: 8 },
    { name: 'Thu', value: 18 },
    { name: 'Fri', value: 11 },
    { name: 'Sat', value: 6 },
    { name: 'Sun', value: 9 },
  ], [])

  const responseTimeData = useMemo(() => [
    { name: 'W1', value: 10 },
    { name: 'W2', value: 12 },
    { name: 'W3', value: 11 },
    { name: 'W4', value: 14 },
    { name: 'W5', value: 15 },
    { name: 'W6', value: 16 },
  ], [])

  const priorityData = useMemo(() => [
    { name: 'Critical', value: 25, color: '#ef4444' },
    { name: 'High', value: 30, color: '#f97316' },
    { name: 'Medium', value: 20, color: '#eab308' },
    { name: 'Low', value: 25, color: '#22c55e' },
  ], [])

  const specialNeeds = [
    { label: 'Children', value: '34', icon: Baby, color: 'text-pink-600', bg: 'bg-pink-50' },
    { label: 'Elderly', value: '52', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Disabled', value: '18', icon: Accessibility, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Pregnant', value: '12', icon: Heart, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Animals', value: '27', icon: PawPrint, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Medical', value: '41', icon: Brain, color: 'text-green-600', bg: 'bg-green-50' },
  ]

  const ML_STATS = [
    { label: 'F1 Score', value: '0.87', sub: 'Target: ≥ 0.80', color: 'text-blue-700', bg: 'bg-blue-50/50' },
    { label: 'NLP Accuracy', value: '89%', sub: 'Target: ≥ 85%', color: 'text-green-700', bg: 'bg-green-50/50' },
    { label: 'Avg Processing', value: '1.2s', sub: 'Per incident', color: 'text-purple-700', bg: 'bg-purple-50/50' },
    { label: 'Model Version', value: 'v2.1', sub: 'Updated 2 days ago', color: 'text-orange-700', bg: 'bg-orange-50/50' },
  ]

  const kpis = [
    { label: 'Total Incidents', value: '248', trend: '+12%', isUp: true },
    { label: 'Avg Response Time', value: '14m', trend: '-18%', isUp: false },
    { label: 'Volunteer Utilization', value: '76%', trend: '+8%', isUp: true },
    { label: 'Alert Delivery Rate', value: '98.2%', trend: '+1.2%', isUp: true },
  ]
  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1e293b]">Analytics & Reports</h1>
          <p className="text-slate-500 mt-1 font-medium">System performance and insights</p>
        </div>
        <button className="px-6 py-3 bg-[#0061ff] text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/25 hover:scale-[1.02] transition-all active:scale-95">
          <Download className="w-5 h-5" />
          Export PDF Report
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-white border border-slate-100 rounded-[1.5rem] p-8 flex flex-col justify-between hover:shadow-lg transition-all shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">{kpi.label}</span>
              <div className={cn(
                "flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg",
                kpi.isUp ? "text-green-600" : "text-red-500"
              )}>
                {kpi.isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {kpi.trend}
              </div>
            </div>
            <div className="text-4xl font-bold text-[#1e293b]">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Distribution Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="suraksha-card p-10 space-y-8">
            <h3 className="text-[15px] font-bold text-[#1e293b]">Safety Status Distribution</h3>
            <div className="space-y-6">
               {[
                 { label: 'I am safe', val: '687 (82%)', color: 'text-green-500', barColor: 'bg-green-500', percent: '82' },
                 { label: 'Need help', val: '98 (12%)', color: 'text-red-500', barColor: 'bg-red-500', percent: '12' },
                 { label: 'Missing', val: '34 (4%)', color: 'text-orange-500', barColor: 'bg-orange-500', percent: '4' },
                 { label: 'Reached shelter', val: '23 (3%)', color: 'text-blue-500', barColor: 'bg-blue-500', percent: '3' },
               ].map((item, i) => (
                 <div key={i} className="space-y-3">
                    <div className="flex justify-between items-end text-xs font-semibold">
                       <span className="text-slate-500">{item.label}</span>
                       <span className={cn("font-bold", item.color)}>{item.val}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                       <div className={cn("h-full rounded-full transition-all duration-1000", item.barColor)} style={{ width: `${item.percent}%` }} />
                    </div>
                 </div>
               ))}
            </div>
         </div>

         <div className="suraksha-card p-10 space-y-8">
            <h3 className="text-[15px] font-bold text-[#1e293b]">Resource Availability</h3>
            <div className="space-y-6 flex flex-col justify-between h-[calc(100%-40px)]">
               {[
                 { label: 'Boats', value: '23', icon: Send, color: 'text-blue-600', rotate: true },
                 { label: 'Vehicles', value: '15', icon: Box, color: 'text-green-600' },
                 { label: 'Generators', value: '8', icon: Zap, color: 'text-orange-500' },
                 { label: 'Shelter Rooms', value: '34', icon: Building2, color: 'text-purple-600' },
               ].map((item, i) => (
                 <div key={i} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-white group-hover:shadow-md transition-all">
                          <item.icon className={cn("w-5 h-5", item.color, item.rotate && "rotate-[30deg]")} />
                       </div>
                       <span className="text-sm font-semibold text-slate-500 group-hover:text-[#1e293b] transition-colors">{item.label}</span>
                    </div>
                    <span className="text-xl font-bold text-blue-600">{item.value}</span>
                 </div>
               ))}
            </div>
         </div>

         <div className="suraksha-card p-10 space-y-8">
            <h3 className="text-[15px] font-bold text-[#1e293b]">Donation Impact</h3>
            <div className="flex flex-col items-center justify-center space-y-1 py-4">
               <div className="text-4xl font-bold text-green-600">LKR 2.4M</div>
               <div className="text-xs font-semibold text-slate-400 mt-2">Total raised</div>
            </div>
            <div className="space-y-5 pt-4 border-t border-slate-50">
               {[
                 { label: 'Families helped', value: '456', color: 'text-[#1e293b]' },
                 { label: 'Active donors', value: '1,234', color: 'text-[#1e293b]' },
                 { label: 'Fulfillment rate', value: '98.2%', color: 'text-green-600' },
               ].map((item, i) => (
                 <div key={i} className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-400">{item.label}</span>
                    <span className={cn("font-bold", item.color)}>{item.value}</span>
                 </div>
               ))}
            </div>
         </div>
      </div>

      <div className="suraksha-card p-8 space-y-8">
         <h3 className="text-[15px] font-bold text-[#1e293b]">High-Priority Cases (Special Needs)</h3>
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {specialNeeds.map((item, i) => (
              <div key={i} className={cn("p-6 rounded-[1.5rem] flex flex-col items-center text-center gap-3 group hover:scale-[1.05] transition-all border border-transparent hover:border-white/50 cursor-pointer shadow-sm", item.bg)}>
                 <item.icon className={cn("w-6 h-6", item.color)} />
                 <div className={cn("text-2xl font-bold", item.color)}>{item.value}</div>
                 <div className={cn("text-[11px] font-semibold opacity-70", item.color)}>{item.label}</div>
              </div>
            ))}
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Incident Frequency */}
        <div className="suraksha-card p-10 flex flex-col min-h-[420px]">
          <h3 className="text-[15px] font-bold text-[#1e293b] mb-12">Incident Frequency (Weekly)</h3>
          <div className="h-[260px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} 
                  dy={10}
                />
                <YAxis hide domain={[0, 25]} />
                <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
                <Bar 
                  dataKey="value" 
                  fill="#00AEEF" 
                  radius={[4, 4, 0, 0]} 
                  barSize={32}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
            {/* Bar Labels Row */}
            <div className="absolute top-[200px] left-8 right-8 flex justify-between pointer-events-none">
               {weeklyData.map((d, i) => (
                 <span key={i} className="text-[11px] font-bold text-slate-700 w-10 text-center">{d.value}</span>
               ))}
            </div>
          </div>
        </div>

        {/* Avg Response Time */}
        <div className="suraksha-card p-10 flex flex-col min-h-[420px]">
          <h3 className="text-[15px] font-bold text-[#1e293b] mb-12">Avg Response Time (Minutes)</h3>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} 
                  dy={10}
                />
                <YAxis hide domain={[0, 20]} />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#00AEEF" 
                  strokeWidth={4} 
                  dot={{ r: 0 }} 
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#00AEEF' }} 
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="suraksha-card p-8 flex flex-col items-center">
           <h3 className="text-[15px] font-bold text-[#1e293b] mb-12 w-full">Priority Distribution</h3>
           <div className="relative w-full h-[240px]">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="70%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
             </ResponsiveContainer>
             <div className="absolute top-[65%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <span className="text-4xl font-bold block text-[#1e293b]">248</span>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total</span>
             </div>
           </div>
           
           <div className="grid grid-cols-2 gap-x-12 gap-y-4 mt-8 w-full px-8">
              {priorityData.map((item) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-tight">{item.name} ({item.value}%)</span>
                </div>
              ))}
           </div>
        </div>

        {/* Volunteer Activity */}
        <div className="suraksha-card p-8 flex flex-col">
           <h3 className="text-[15px] font-bold text-[#1e293b] mb-10">Volunteer Activity</h3>
            <div className="space-y-10">
               <div className="space-y-4">
                 <div className="flex justify-between items-end">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-tight">Active Tasks</span>
                    <span className="text-xs font-bold text-green-600">84 volunteers</span>
                 </div>
                 <div className="h-2.5 w-full bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full w-[84%]" />
                 </div>
               </div>

               <div className="space-y-4">
                 <div className="flex justify-between items-end">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-tight">Available</span>
                    <span className="text-xs font-bold text-blue-600">26 volunteers</span>
                 </div>
                 <div className="h-2.5 w-full bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full w-[26%]" />
                 </div>
               </div>

               <div className="pt-8 border-t border-slate-50">
                 <div className="text-4xl font-bold text-[#1e293b] mb-1">15</div>
                 <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-tight leading-relaxed">Average Tasks Completed per Volunteer</div>
               </div>
            </div>
        </div>
      </div>

      {/* ML Performance Row */}
      <div className="suraksha-card p-10 space-y-8">
        <h3 className="text-[15px] font-bold text-[#1e293b]">ML Model Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {ML_STATS.map((card, i) => (
            <div key={i} className={cn("p-8 rounded-[1.5rem] flex flex-col items-center text-center transition-all hover:scale-[1.05] shadow-sm cursor-default", card.bg)}>
               <div className={cn("text-4xl font-bold mb-2", card.color)}>{card.value}</div>
               <div className="text-[12px] font-bold text-slate-600 uppercase tracking-widest opacity-80">{card.label}</div>
               <div className="text-[10px] font-semibold text-slate-400 mt-1">{card.sub}</div>
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
      <div className="bg-[#1e293b] px-4 py-2 rounded-xl shadow-2xl border border-white/10 text-xs font-bold text-white">
        {payload[0].value}
      </div>
    )
  }
  return null
}
