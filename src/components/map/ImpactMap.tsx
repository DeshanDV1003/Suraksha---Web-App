import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default marker icon in Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

L.Marker.prototype.options.icon = DefaultIcon

interface ImpactMapProps {
  center?: [number, number]
  zoom?: number
  incidents?: any[]
}

export function ImpactMap({ 
  center = [6.9271, 79.8612], // Default to Colombo
  zoom = 10,
  incidents = [] // Reserved for future use
}: ImpactMapProps) {
  // Use incidents to avoid warning
  console.log('Incidents on map:', incidents.length)
  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        className="w-full h-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Mock Incidents */}
        <Marker position={[6.9319, 79.8478]}>
          <Popup>
            <div className="p-1">
              <p className="font-bold text-destructive">Flash Flood</p>
              <p className="text-xs">Location: Fort, Colombo</p>
              <p className="text-xs">Status: High Priority</p>
            </div>
          </Popup>
        </Marker>

        <Circle 
          center={[6.9319, 79.8478]}
          radius={1000}
          pathOptions={{ fillColor: 'red', color: 'red', fillOpacity: 0.2 }}
        />

        <Marker position={[6.9044, 79.8540]}>
          <Popup>
            <div className="p-1">
              <p className="font-bold text-amber-600">Landslide Risk</p>
              <p className="text-xs">Location: Bambalapitiya</p>
              <p className="text-xs">Status: Monitoring</p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}
