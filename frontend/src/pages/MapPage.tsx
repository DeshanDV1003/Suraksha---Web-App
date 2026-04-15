import { 
  Layers, 
  Zap,
  Route,
  MapPin
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const MAP_STATS = [
  { label: 'Critical Incidents', value: '5', color: 'text-red-500' },
  { label: 'High Priority', value: '7', color: 'text-orange-500' },
  { label: 'Active Volunteers', value: '84', color: 'text-green-500' },
  { label: 'Active Alert Zones', value: '3', color: 'text-blue-500' },
]

export default function MapPage() {
  const [layers, setLayers] = useState({
    incidents: true,
    heatmap: true,
    volunteers: true,
    safeRoutes: true,
    blockedRoads: true,
    alertZones: false,
    reliefCamps: false
  })

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 font-sans h-full">
      {/* Map Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1e293b]">GIS Impact Map</h1>
          <p className="text-slate-500 mt-1 font-medium">Heatmap, safe routes, and hazard zones</p>
        </div>

        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-2.5 bg-[#8b5cf6] text-white rounded-xl text-sm font-semibold shadow-lg shadow-purple-500/20 hover:scale-[1.02] transition-all active:scale-95">
            <Route className="w-4 h-4" />
            Safe Routes
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-[#10b981] text-white rounded-xl text-sm font-semibold shadow-lg shadow-green-500/20 hover:scale-[1.02] transition-all active:scale-95">
            <Zap className="w-4 h-4" />
            Live View
          </button>
        </div>
      </div>

      {/* Main Map Area Container */}
      <div className="flex-1 min-h-[500px] bg-[#e0f2fe] rounded-[2.5rem] border-4 border-white shadow-xl relative overflow-hidden flex items-center justify-center">
        {/* Map Background Grid */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none" />
        
        {/* Floating Layers Panel */}
        <div className="absolute top-8 right-8 w-64 bg-white/90 backdrop-blur-md border border-slate-100 rounded-[2rem] shadow-2xl p-6 z-10">
          <h4 className="text-xs font-bold text-[#1e293b] mb-4">Layers</h4>
          <div className="space-y-3">
            {Object.entries(layers).map(([key, enabled]) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={enabled}
                  onChange={() => setLayers(prev => ({ ...prev, [key]: !enabled }))}
                  className="w-4.5 h-4.5 rounded border-slate-200 text-blue-600 focus:ring-blue-500/20 transition-all"
                />
                <span className={cn(
                  "text-xs font-semibold capitalize transition-colors group-hover:text-blue-600",
                  enabled ? "text-[#1e293b]" : "text-slate-400"
                )}>
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </label>
            ))}
          </div>
          <div className="h-px bg-slate-100 my-4" />
          <button className="flex items-center gap-2 text-blue-600 font-bold text-[11px] uppercase tracking-widest hover:underline transition-all w-full">
            <Layers className="w-3.5 h-3.5" />
            More Layers
          </button>
        </div>

        {/* Floating Legend Panel */}
        <div className="absolute bottom-8 left-8 w-56 bg-white/90 backdrop-blur-md border border-slate-100 rounded-[2rem] shadow-2xl p-6 z-10">
          <h4 className="text-xs font-bold text-[#1e293b] mb-4">Legend</h4>
          <div className="space-y-3">
            {[
              { label: 'Critical Incident', color: 'bg-red-500' },
              { label: 'High Priority', color: 'bg-orange-500' },
              { label: 'Medium Priority', color: 'bg-yellow-400' },
              { label: 'Active Volunteer', color: 'bg-green-500' },
              { label: 'Safe Route', color: 'bg-purple-500', isLine: true },
              { label: 'Blocked Road', color: 'bg-red-500', isLine: true },
              { label: 'High Risk Zone', color: 'bg-red-500/20', isZone: true },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={cn(
                  "shadow-sm shrink-0",
                  item.isLine ? "w-4 h-1 rounded-full" : 
                  item.isZone ? "w-4 h-4 rounded-sm border border-red-200" :
                  "w-3 h-3 rounded-full",
                  item.color
                )} />
                <span className="text-[11px] font-semibold text-slate-600">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Map Center Logic Placeholder */}
        <div className="flex flex-col items-center gap-2 transform -translate-y-8 pointer-events-none">
          <div className="p-5 bg-white rounded-full shadow-2xl animate-bounce">
            <MapPin className="w-12 h-12 text-blue-600 fill-blue-50" />
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-[#1e293b]">Interactive GIS Map</div>
            <div className="text-sm font-semibold text-slate-500 mt-1">Leaflet.js + OpenStreetMap + PostGIS</div>
          </div>
        </div>

        {/* Scattered Map Pins */}
        <div className="absolute top-[25%] left-[20%] group cursor-pointer z-0">
          <div className="w-8 h-8 flex items-center justify-center bg-red-500 rounded-full border-4 border-white shadow-xl animate-pulse ring-8 ring-red-500/10" />
        </div>
        <div className="absolute bottom-[35%] right-[25%] group cursor-pointer">
          <div className="w-6 h-6 flex items-center justify-center bg-orange-500 rounded-full border-2 border-white shadow-xl ring-4 ring-orange-500/10" />
        </div>
        <div className="absolute top-[45%] left-[30%] group cursor-pointer">
          <div className="w-4 h-4 flex items-center justify-center bg-green-500 rounded-full border-2 border-white shadow-xl" />
        </div>
        <div className="absolute bottom-[20%] right-[10%] group cursor-pointer">
          <div className="w-4 h-4 flex items-center justify-center bg-green-500 rounded-full border-2 border-white shadow-xl" />
        </div>
      </div>

      {/* Map Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pb-10">
        {MAP_STATS.map((stat, i) => (
          <div key={i} className="bg-white border border-slate-100 rounded-[2rem] p-10 flex flex-col items-center justify-center hover:shadow-lg transition-all shadow-sm">
            <span className={cn("text-5xl font-bold mb-3", stat.color)}>{stat.value}</span>
            <span className="text-[13px] font-semibold text-slate-500 text-center">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

