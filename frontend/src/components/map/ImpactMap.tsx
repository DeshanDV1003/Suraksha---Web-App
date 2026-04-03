import React from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { cn } from '@/lib/utils'

// Custom pulsing marker helper
const createPulsingIcon = (colorClass: string) => {
  return L.divIcon({
    className: 'custom-pulsing-marker',
    html: `
      <div class="pulsing-marker ${colorClass}">
        <div class="w-3 h-3 rounded-full bg-current pulsing-marker-dot"></div>
      </div>
    `,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  })
}

interface ImpactMapProps {
  center?: [number, number]
  zoom?: number
  showIncidents?: boolean
  showVolunteers?: boolean
  showHeatmap?: boolean
}

export function ImpactMap({ 
  center = [6.9271, 79.8612],
  zoom = 13,
  showIncidents = true,
  showVolunteers = true,
  showHeatmap = true
}: ImpactMapProps) {
  
  const mockMarkers = [
    { pos: [6.9319, 79.8478], type: 'critical', label: 'Flash Flood', color: 'text-red-500' },
    { pos: [6.9044, 79.8540], type: 'high', label: 'Landslide Risk', color: 'text-orange-500' },
    { pos: [6.9150, 79.8650], type: 'medium', label: 'Building Collapse', color: 'text-yellow-500' },
    { pos: [6.9200, 79.8750], type: 'volunteer', label: 'Active Volunteer', color: 'text-green-500' },
    { pos: [6.9350, 79.8600], type: 'volunteer', label: 'Active Volunteer', color: 'text-green-500' },
  ]

  return (
    <div className="w-full h-full relative z-0 flex rounded-2xl overflow-hidden border border-border/50">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        className="w-full h-full"
        scrollWheelZoom={false}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" // Cleaner, more professional map style
        />
        
        {showIncidents && mockMarkers.filter(m => m.type !== 'volunteer').map((marker, idx) => (
          <React.Fragment key={idx}>
            <Marker 
              position={marker.pos as [number, number]} 
              icon={createPulsingIcon(marker.color)}
            >
              <Popup className="suraksha-popup">
                <div className="p-2 min-w-[120px]">
                  <p className={cn("font-bold uppercase text-[10px] tracking-wider mb-1", marker.color)}>{marker.label}</p>
                  <p className="text-xs font-semibold text-foreground">Zone #INC-124{idx}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Status: Active Monitoring</p>
                </div>
              </Popup>
            </Marker>
            {marker.type === 'critical' && (
              <Circle 
                center={marker.pos as [number, number]}
                radius={800}
                pathOptions={{ 
                  fillColor: '#ef4444', 
                  color: '#ef4444', 
                  fillOpacity: 0.1,
                  weight: 1
                }}
              />
            )}
          </React.Fragment>
        ))}

        {showHeatmap && (
          <Circle 
            center={[6.9150, 79.8550]}
            radius={2000}
            pathOptions={{ 
              fillColor: '#3b82f6', 
              color: '#3b82f6', 
              fillOpacity: 0.05,
              weight: 0
            }}
          />
        )}

        {showVolunteers && mockMarkers.filter(m => m.type === 'volunteer').map((marker, idx) => (
          <Marker 
            key={`vol-${idx}`}
            position={marker.pos as [number, number]} 
            icon={createPulsingIcon(marker.color)}
          >
            <Popup>
              <div className="p-1">
                <p className="font-bold text-green-600 text-xs text-center">{marker.label}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
