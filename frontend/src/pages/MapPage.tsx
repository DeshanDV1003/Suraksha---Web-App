import { useState } from 'react'
import { ImpactMap } from '@/components/map/ImpactMap'
import { Activity, Shield, ChevronRight, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LayersState {
  incidents: boolean
  heatmap: boolean
  volunteers: boolean
  alerts: boolean
}

export default function MapPage() {
  const [layers, setLayers] = useState<LayersState>({
    incidents: true,
    heatmap: true,
    volunteers: true,
    alerts: false
  })

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">GIS Impact Map</h1>
          <p className="text-muted-foreground mt-1 font-medium">Real-time spatial visualization</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-green-600/20 active:scale-95">
            <Activity className="w-4 h-4 animate-pulse" />
            Live View
          </button>
        </div>
      </div>
      
      <div className="flex-1 bg-card border border-border/50 rounded-3xl shadow-xl overflow-hidden relative group">
        <ImpactMap 
          showIncidents={layers.incidents}
          showVolunteers={layers.volunteers}
          showHeatmap={layers.heatmap}
        />

        {/* Floating Layer Control */}
        <div className="absolute top-6 right-6 z-[400] w-52 bg-white/90 backdrop-blur-md border border-white/20 p-5 rounded-2xl shadow-2xl space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Layers
            </h4>
          </div>
          <div className="space-y-3">
            {[
              { id: 'incidents', label: 'Incidents' },
              { id: 'heatmap', label: 'Heatmap' },
              { id: 'volunteers', label: 'Volunteers' },
              { id: 'alerts', label: 'Alerts Zones' },
            ].map((layer) => (
              <label key={layer.id} className="flex items-center gap-3 cursor-pointer group/label">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox" 
                    checked={layers[layer.id as keyof LayersState]} 
                    onChange={() => {
                      const id = layer.id as keyof LayersState;
                      setLayers(prev => ({ ...prev, [id]: !prev[id] }));
                    }}
                    className="peer appearance-none w-5 h-5 border-2 border-primary/20 rounded-md checked:bg-primary checked:border-primary transition-all"
                  />
                  <ChevronRight className={cn(
                    "absolute inset-0 w-5 h-5 text-white scale-0 transition-transform peer-checked:scale-75",
                    layers[layer.id as keyof LayersState] && "scale-75"
                  )} />
                </div>
                <span className="text-xs font-bold text-muted-foreground group-checked:text-foreground transition-colors uppercase tracking-tight">
                  {layer.label}
                </span>
              </label>
            ))}
          </div>
          <button className="w-full pt-3 border-t border-border/50 text-[10px] font-bold text-primary flex items-center justify-center gap-1 hover:underline">
            <Shield className="w-3 h-3" /> More Layers
          </button>
        </div>

        {/* Floating Legend */}
        <div className="absolute bottom-6 left-6 z-[400] w-56 bg-white/90 backdrop-blur-md border border-white/20 p-5 rounded-2xl shadow-2xl">
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Legend</h4>
          <div className="space-y-3">
            {[
              { label: 'Critical Incident', color: 'bg-red-500' },
              { label: 'High Priority', color: 'bg-orange-500' },
              { label: 'Medium Priority', color: 'bg-yellow-500' },
              { label: 'Active Volunteer', color: 'bg-green-500' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={cn("w-3 h-3 rounded-full", item.color)} />
                <span className="text-[11px] font-bold text-foreground/80">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Metrics Bar */}
      <div className="grid grid-cols-4 gap-6 h-32">
        {[
          { label: 'Critical Incidents', value: '5', color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'High Priority', value: '7', color: 'text-orange-500', bg: 'bg-orange-50' },
          { label: 'Active Volunteers', value: '84', color: 'text-green-500', bg: 'bg-green-50' },
          { label: 'Active Alert Zones', value: '3', color: 'text-blue-500', bg: 'bg-blue-50' },
        ].map((stat, i) => (
          <div key={i} className="suraksha-card flex flex-col items-center justify-center p-4 hover:border-primary/20 transition-all group">
            <span className={cn("text-4xl font-black mb-1 group-hover:scale-110 transition-transform", stat.color)}>{stat.value}</span>
            <span className="text-[11px] font-bold uppercase tracking-tighter text-muted-foreground">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
