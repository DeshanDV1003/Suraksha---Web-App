import { 
  Layers, 
  Zap,
  Route,
  MapPin,
  AlertCircle
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import { cn } from '@/lib/utils'
import { incidentService } from '../services/api'
import L from 'leaflet'

// Fix Leaflet icon issue
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

export default function MapPage() {
  const [incidents, setIncidents] = useState<any[]>([])
  const [layers, setLayers] = useState({
    incidents: true,
    riskZones: true,
    reliefCamps: true
  })

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await incidentService.getIncidents()
        setIncidents(res.data)
      } catch (err) {
        console.error('Failed to fetch incidents for map', err)
      }
    }
    fetchIncidents()
  }, [])

  const MAP_STATS = [
    { label: 'Total Incidents', value: incidents.length.toString(), color: 'text-red-500' },
    { label: 'Critical Areas', value: incidents.filter(i => i.severity === 'CRITICAL').length.toString(), color: 'text-orange-500' },
    { label: 'Active Volunteers', value: '84', color: 'text-green-500' },
    { label: 'Evacuation Zones', value: '3', color: 'text-blue-500' },
  ]

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 font-sans h-full">
      {/* Map Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1e293b]">GIS Impact Map</h1>
          <p className="text-slate-500 mt-1 font-medium">Real-time hazard monitoring and asset tracking</p>
        </div>

        <div className="flex gap-3">
          <button className="suraksha-button flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Live View
          </button>
        </div>
      </div>

      {/* Main Map Area Container */}
      <div className="flex-1 min-h-[600px] rounded-[2.5rem] border-8 border-white shadow-2xl relative overflow-hidden">
        {/* React Leaflet Map */}
        <MapContainer 
          center={[6.9271, 79.8612]} // Colombo Coordinates 
          zoom={12} 
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {layers.incidents && incidents.map((incident, idx) => (
             incident.latitude && incident.longitude && (
               <Marker key={idx} position={[incident.latitude, incident.longitude]}>
                <Popup className="suraksha-popup">
                  <div className="p-1">
                    <h4 className="font-extrabold text-[#1e293b]">{incident.title}</h4>
                    <p className="text-xs font-bold text-slate-500 mt-1">{incident.location}</p>
                    <div className={cn(
                      "mt-3 text-[10px] font-bold px-2 py-1 rounded-full inline-block uppercase",
                      incident.severity === 'CRITICAL' ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"
                    )}>
                      {incident.severity}
                    </div>
                  </div>
                </Popup>
              </Marker>
             )
          ))}

          {layers.riskZones && incidents.filter(i => i.severity === 'CRITICAL').map((incident, idx) => (
             incident.latitude && incident.longitude && (
               <Circle 
                 key={`zone-${idx}`}
                 center={[incident.latitude, incident.longitude]}
                 pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.1 }}
                 radius={1000}
               />
             )
          ))}
        </MapContainer>
        
        {/* Floating Layers Panel */}
        <div className="absolute top-8 right-8 w-60 bg-white/95 backdrop-blur-md border border-white shadow-2xl rounded-[2rem] p-6 z-10 transition-all hover:scale-[1.02]">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 pl-1">Layers</h4>
          <div className="space-y-4">
            {Object.entries(layers).map(([key, enabled]) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer group select-none">
                <div 
                  onClick={() => setLayers(prev => ({ ...prev, [key]: !enabled }))}
                  className={cn(
                    "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                    enabled ? "bg-[#0061ff] border-[#0061ff]" : "border-slate-200"
                  )}
                >
                  {enabled && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
                <span className={cn(
                  "text-xs font-bold transition-colors group-hover:text-[#0061ff]",
                  enabled ? "text-[#1e293b]" : "text-slate-400"
                )}>
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Floating Legend Panel */}
        <div className="absolute bottom-10 right-10 w-52 bg-white/95 backdrop-blur-md border border-white shadow-2xl rounded-3xl p-6 z-10">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 pl-1">Legend</h4>
          <div className="space-y-3">
            {[
              { label: 'Critical Incident', color: 'bg-red-500' },
              { label: 'Active Hazard', color: 'bg-orange-500' },
              { label: 'Safe Zone', color: 'bg-green-500' },
              { label: 'Risk Perimeter', color: 'bg-red-500/20', isZone: true },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={cn(
                  "shadow-sm shrink-0",
                  item.isZone ? "w-4 h-4 rounded-sm border border-red-200" : "w-3 h-3 rounded-full",
                  item.color
                )} />
                <span className="text-[11px] font-bold text-[#1e293b]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pb-20">
        {MAP_STATS.map((stat, i) => (
          <div key={i} className="suraksha-card p-10 flex flex-col items-center justify-center text-center hover:shadow-xl transition-all">
            <span className={cn("text-5xl font-extrabold mb-3", stat.color)}>{stat.value}</span>
            <span className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

