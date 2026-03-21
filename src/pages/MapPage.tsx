import { ImpactMap } from '@/components/map/ImpactMap'

export default function MapPage() {
  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Impact Map</h1>
          <p className="text-muted-foreground">GIS visualization of active disaster zones and volunteer clusters.</p>
        </div>
        <div className="flex items-center gap-2 bg-card border px-4 py-2 rounded-lg">
          <label className="text-sm font-medium flex items-center gap-2">
            <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary" />
            Incidents
          </label>
          <label className="text-sm font-medium flex items-center gap-2 ml-4">
            <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary" />
            Heatmap
          </label>
          <label className="text-sm font-medium flex items-center gap-2 ml-4">
            <input type="checkbox" className="rounded border-gray-300 text-primary" />
            Volunteers
          </label>
        </div>
      </div>
      
      <div className="flex-1 bg-card border rounded-2xl shadow-sm overflow-hidden relative">
        <ImpactMap />
      </div>
    </div>
  )
}
