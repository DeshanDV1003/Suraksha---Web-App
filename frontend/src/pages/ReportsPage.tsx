import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts'
import { Download, TrendingUp, TrendingDown, Search, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const weeklyData = [
  { name: 'Mon', value: 12 },
  { name: 'Tue', value: 15 },
  { name: 'Wed', value: 8 },
  { name: 'Thu', value: 18 },
  { name: 'Fri', value: 11 },
  { name: 'Sat', value: 6 },
  { name: 'Sun', value: 9 },
]

const responseTimeData = [
  { name: 'W1', value: 10 },
  { name: 'W2', value: 12 },
  { name: 'W3', value: 11 },
  { name: 'W4', value: 14 },
  { name: 'W5', value: 15 },
  { name: 'W6', value: 16 },
]

const priorityData = [
  { name: 'Critical', value: 25, color: '#ef4444' }, // Red
  { name: 'High', value: 30, color: '#f97316' },     // Orange
  { name: 'Medium', value: 20, color: '#eab308' },   // Yellow
  { name: 'Low', value: 25, color: '#22c55e' },      // Green
]

const kpis = [
  { label: 'Total Incidents', value: '248', trend: '+12%', isUp: true },
  { label: 'Avg Response Time', value: '14m', trend: '-18%', isUp: false },
  { label: 'Volunteer Utilization', value: '76%', trend: '+8%', isUp: true },
  { label: 'Alert Delivery Rate', value: '98.2%', trend: '+1.2%', isUp: true },
]

const ML_CARDS = [
  { label: 'F1 Score', value: '0.87', sub: 'Target: ≥ 0.80', color: 'text-blue-700', bg: 'bg-blue-50/50' },
  { label: 'NLP Accuracy', value: '89%', sub: 'Target: ≥ 85%', color: 'text-green-700', bg: 'bg-green-50/50' },
  { label: 'Avg Processing', value: '1.2s', sub: 'Per incident', color: 'text-purple-700', bg: 'bg-purple-50/50' },
  { label: 'Model Version', value: 'v2.1', sub: 'Updated 2 days ago', color: 'text-orange-700', bg: 'bg-orange-50/50' },
]

export default function ReportsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase tracking-tight">Analytics & Reports</h1>
          <p className="text-muted-foreground mt-1 font-medium">System performance and insights</p>
        </div>
        <button className="px-6 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95">
          <Download className="w-5 h-5" />
          Export PDF Report
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <div key={i} className="suraksha-card p-6 flex flex-col justify-between hover:border-primary/20 transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">{kpi.label}</span>
              <div className={cn(
                "flex items-center gap-1 text-[10px] font-black uppercase tracking-tighter",
                kpi.isUp ? "text-green-600" : "text-red-600"
              )}>
                {kpi.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {kpi.trend}
              </div>
            </div>
            <div className="text-3xl font-black text-foreground">{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Incident Frequency */}
        <div className="suraksha-card p-8 flex flex-col">
          <h3 className="text-xl font-bold mb-10">Incident Frequency (Weekly)</h3>
          <div className="flex-1 h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} 
                  dy={10}
                />
                <YAxis hide domain={[0, 25]} />
                <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
                <Bar 
                  dataKey="value" 
                  fill="#0076D6" 
                  radius={[6, 6, 0, 0]} 
                  barSize={40}
                  label={{ position: 'top', fill: '#1e293b', fontSize: 11, fontWeight: 800, dy: -10 }} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Avg Response Time */}
        <div className="suraksha-card p-8 flex flex-col">
          <h3 className="text-xl font-bold mb-10">Avg Response Time (Minutes)</h3>
          <div className="flex-1 h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} 
                  dy={10}
                />
                <YAxis hide domain={[0, 20]} />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#00AEEF" 
                  strokeWidth={3} 
                  dot={{ r: 0 }} 
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#00AEEF' }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="suraksha-card p-8 flex flex-col items-center">
           <h3 className="text-xl font-bold mb-8 w-full">Priority Distribution</h3>
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
                <span className="text-4xl font-black block">248</span>
                <span className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest mt-1">Total</span>
             </div>
           </div>
           
           <div className="grid grid-cols-2 gap-x-12 gap-y-4 mt-4 w-full px-8">
              {priorityData.map((item) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[11px] font-bold text-muted-foreground whitespace-nowrap">{item.name} ({item.value}%)</span>
                </div>
              ))}
           </div>
        </div>

        {/* Volunteer Activity */}
        <div className="suraksha-card p-8 flex flex-col">
           <h3 className="text-xl font-bold mb-8">Volunteer Activity</h3>
           <div className="space-y-10">
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                   <span className="text-xs font-bold text-muted-foreground">Active Tasks</span>
                   <span className="text-xs font-black text-green-600">84 volunteers</span>
                </div>
                <div className="h-2.5 w-full bg-muted/30 rounded-full overflow-hidden">
                   <div className="h-full bg-green-500 rounded-full w-[84%]" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-end">
                   <span className="text-xs font-bold text-muted-foreground">Available</span>
                   <span className="text-xs font-black text-blue-600">26 volunteers</span>
                </div>
                <div className="h-2.5 w-full bg-muted/30 rounded-full overflow-hidden">
                   <div className="h-full bg-blue-500 rounded-full w-[26%]" />
                </div>
              </div>

              <div className="pt-6 border-t border-border/40">
                <div className="text-3xl font-black mb-1">15</div>
                <div className="text-xs font-bold text-muted-foreground tracking-tight">Average Tasks Completed per Volunteer</div>
              </div>
           </div>
        </div>
      </div>

      {/* ML Performance Row */}
      <div className="suraksha-card p-8 space-y-8">
        <h3 className="text-xl font-bold">ML Model Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {ML_CARDS.map((card, i) => (
            <div key={i} className={cn("p-6 rounded-3xl flex flex-col items-center text-center transition-all hover:scale-[1.02]", card.bg)}>
               <div className={cn("text-3xl font-black mb-1", card.color)}>{card.value}</div>
               <div className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-2 opacity-70">{card.label}</div>
               <div className="text-[10px] font-bold text-muted-foreground/60">{card.sub}</div>
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
      <div className="bg-white px-3 py-2 rounded-xl shadow-2xl border border-primary/5 text-xs font-black text-primary">
        {payload[0].value}
      </div>
    )
  }
  return null
}
