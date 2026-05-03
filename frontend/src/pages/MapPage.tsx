import { 
  Layers, 
  Zap,
  Route,
  MapPin,
  AlertCircle
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import { cn } from '@/lib/utils'
import { incidentService, campService } from '../services/api'
import L from 'leaflet'
import { useEffect as useLayoutEffect } from 'react'

// Fix Leaflet icon issue
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

// Helper to get marker color based on category
const getCategoryColor = (category: string) => {
  switch (category?.toUpperCase()) {
    case 'FLOOD': return '#0EA5E9' // Blue
    case 'LANDSLIDE': return '#84CC16' // Lime
    case 'STORM': return '#8B5CF6' // Violet
    case 'MEDICAL': return '#06B6D4' // Cyan
    case 'FIRE': return '#EF4444' // Red
    case 'NATURAL DISASTER': return '#F59E0B' // Amber
    default: return '#6366F1' // Indigo
  }
}

// Create a custom marker icon with dynamic color
const createCustomIcon = (category: string) => {
  const color = getCategoryColor(category);
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-center; justify-content: center;">
             <div style="background-color: white; width: 6px; height: 6px; border-radius: 50%;"></div>
           </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
}

// Custom icon for Relief Camps
const createCampIcon = () => {
  return L.divIcon({
    className: 'custom-camp-icon',
    html: `<div style="background-color: #22C55E; width: 28px; height: 28px; border-radius: 8px; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-center; justify-content: center; transform: rotate(45deg);">
             <div style="background-color: white; width: 8px; height: 8px; border-radius: 2px; transform: rotate(-45deg);"></div>
           </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
}

// Component to auto-fit bounds
function SetBounds({ incidents, camps, showCamps }: { incidents: any[], camps: any[], showCamps: boolean }) {
  const map = useMap();
  
  useLayoutEffect(() => {
    const points: [number, number][] = incidents.map(i => [i.latitude, i.longitude]);
    if (showCamps) {
      camps.forEach(c => {
        if (c.latitude && c.longitude) points.push([c.latitude, c.longitude]);
      });
    }

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [incidents, camps, showCamps, map]);
  
  return null;
}

export default function MapPage() {
  const [incidents, setIncidents] = useState<any[]>([])
  const [camps, setCamps] = useState<any[]>([])
  const [layers, setLayers] = useState({
    incidents: true,
    riskZones: true,
    reliefCamps: true
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [incidentRes, campRes] = await Promise.all([
          incidentService.getIncidents(),
          campService.getCamps()
        ])
        setIncidents(incidentRes.data)
        setCamps(campRes.data)
      } catch (err) {
        console.error('Failed to fetch data for map', err)
      }
    }
    fetchData()
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
          center={[7.8731, 80.7718]} // Sri Lanka Center
          zoom={7} 
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <SetBounds 
            incidents={incidents.filter(i => i.latitude && i.longitude)} 
            camps={camps.filter(c => c.latitude && c.longitude)}
            showCamps={layers.reliefCamps}
          />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {layers.incidents && incidents.map((incident, idx) => (
             incident.latitude && incident.longitude && (
               <Marker 
                 key={`incident-${idx}`} 
                 position={[incident.latitude, incident.longitude]}
                 icon={createCustomIcon(incident.category)}
               >
                <Popup className="suraksha-popup" minWidth={200}>
                  <div className="p-2">
                    <div className="flex items-center gap-2 mb-3">
                       <div 
                         className="w-3 h-3 rounded-full" 
                         style={{ backgroundColor: getCategoryColor(incident.category) }} 
                       />
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                         {incident.category || 'Incident'}
                       </span>
                    </div>
                    
                    <h4 className="text-sm font-black text-slate-900 leading-tight mb-1">{incident.title}</h4>
                    <p className="text-[11px] font-bold text-slate-400 mb-4">{incident.location}</p>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                       <div className={cn(
                         "text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter",
                         incident.severity === 'CRITICAL' ? "bg-red-500 text-white" : "bg-orange-500 text-white"
                       )}>
                         {incident.severity}
                       </div>
                       <button className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline">
                         View Details
                       </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
             )
          ))}

          {layers.reliefCamps && camps.map((camp, idx) => (
            camp.latitude && camp.longitude && (
              <Marker 
                key={`camp-${idx}`} 
                position={[camp.latitude, camp.longitude]}
                icon={createCampIcon()}
              >
                <Popup className="suraksha-popup" minWidth={200}>
                  <div className="p-2">
                    <div className="flex items-center gap-2 mb-3">
                       <div className="w-3 h-3 rounded-full bg-green-500" />
                       <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">
                         Safety Hub / Relief Camp
                       </span>
                    </div>
                    
                    <h4 className="text-sm font-black text-slate-900 leading-tight mb-1">{camp.name}</h4>
                    <p className="text-[11px] font-bold text-slate-400 mb-4">{camp.location}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-slate-400">Occupancy</span>
                        <span className="text-[#1e293b]">{camp.currentOccupancy} / {camp.totalCapacity}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full" 
                          style={{ width: `${(camp.currentOccupancy / camp.totalCapacity) * 100}%` }} 
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                       <div className="text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter bg-green-50 text-green-700">
                         {camp.status}
                       </div>
                       <button className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline">
                         Camp Dashboard
                       </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          ))}

          {/* Risk Zones Layer */}
          {layers.riskZones && incidents.filter(i => ['CRITICAL', 'HIGH'].includes(i.severity)).map((incident, idx) => (
             incident.latitude && incident.longitude && (
               <Circle 
                 key={`risk-zone-${idx}`}
                 center={[incident.latitude, incident.longitude]}
                 pathOptions={{ 
                   color: incident.severity === 'CRITICAL' ? '#EF4444' : '#F97316', 
                   fillColor: incident.severity === 'CRITICAL' ? '#EF4444' : '#F97316', 
                   fillOpacity: 0.15,
                   weight: 2,
                   dashArray: '5, 10'
                 }}
                 radius={incident.severity === 'CRITICAL' ? 2000 : 1000} // 2km for Critical, 1km for High
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
        <div className="absolute bottom-10 right-10 w-52 bg-white/95 backdrop-blur-md border border-white shadow-2xl rounded-3xl p-6 z-10 transition-all hover:translate-y-[-4px]">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 pl-1">Incident Types</h4>
          <div className="space-y-3">
            {[
              { label: 'Flood Response', color: '#0EA5E9' },
              { label: 'Landslide Alert', color: '#84CC16' },
              { label: 'Storm Management', color: '#8B5CF6' },
              { label: 'Medical Emergency', color: '#06B6D4' },
              { label: 'Fire Hazard', color: '#EF4444' },
              { label: 'Relief Camp', color: '#22C55E', isCamp: true },
              { label: 'General / Other', color: '#6366F1' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div 
                  className={cn(
                    "w-3 h-3 shadow-sm",
                    item.isCamp ? "rounded-sm rotate-45" : "rounded-full"
                  )}
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[11px] font-bold text-slate-700">{item.label}</span>
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

