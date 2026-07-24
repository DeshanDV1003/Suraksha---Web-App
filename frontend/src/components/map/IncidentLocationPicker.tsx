import { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

// Resolve Leaflet icon issues
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

interface Zone {
  zoneId: string;
  zoneName: string;
  province: string;
  level: string;
}

interface LocationValue {
  address: string;
  latitude: number;
  longitude: number;
  zone?: Zone;
}

interface IncidentLocationPickerProps {
  value?: LocationValue;
  onChange: (val: LocationValue) => void;
}

export function IncidentLocationPicker({ value, onChange }: IncidentLocationPickerProps) {
  const [address, setAddress] = useState(value?.address || '');
  const [coords, setCoords] = useState<[number, number] | null>(
    value?.latitude && value?.longitude ? [value.latitude, value.longitude] : null
  );
  const [zone, setZone] = useState<Zone | undefined>(value?.zone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchGeocode = async (text: string) => {
    if (!text || text.trim().length < 5) return;
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:3001/api/location/geocode',
        { address: text },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data && response.data.latitude) {
        const val: LocationValue = {
          address: text,
          latitude: response.data.latitude,
          longitude: response.data.longitude,
          zone: response.data.zone
        };
        setCoords([val.latitude, val.longitude]);
        setZone(val.zone);
        onChange(val);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not geocode this address.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAddress(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchGeocode(val), 800);
  };

  // Sub-component to handle map clicks and reverse geocode coordinates
  function MapEventsHandler() {
    useMapEvents({
      async click(e) {
        const { lat, lng } = e.latlng;
        setLoading(true);
        setError('');

        try {
          const token = localStorage.getItem('token');
          const response = await axios.post(
            'http://localhost:3001/api/location/reverse',
            { latitude: lat, longitude: lng },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const resolvedAddress =
            response.data.address?.road ||
            response.data.address?.suburb ||
            response.data.address?.town ||
            'Selected Coordinate Position';

          setAddress(resolvedAddress);
          setCoords([lat, lng]);
          setZone(response.data.zone);

          onChange({
            address: resolvedAddress,
            latitude: lat,
            longitude: lng,
            zone: response.data.zone
          });
        } catch (err) {
          setError('Failed to fetch address for the selected point.');
        } finally {
          setLoading(false);
        }
      }
    });
    return null;
  }

  return (
    <div className="flex flex-col gap-3 font-sans">
      <div className="relative">
        <input
          type="text"
          value={address}
          onChange={handleInputChange}
          placeholder="Enter address, road, city or landmark in Sri Lanka..."
          className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12 font-medium"
        />
        {loading && (
          <div className="absolute right-4 top-3.5 flex items-center justify-center">
            <div className="animate-spin rounded-full h-4.5 w-4.5 border-2 border-blue-500 border-t-transparent" />
          </div>
        )}
      </div>

      {error && <div className="text-red-500 text-xs font-semibold px-1">âš ï¸ {error}</div>}

      {coords ? (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm transition-all">
          <div className="relative h-48 w-full z-0">
            <div className="absolute top-3 left-3 bg-white dark:bg-gray-900/90 backdrop-blur-sm shadow border px-2.5 py-1.5 rounded-lg text-[10px] font-black text-blue-600 uppercase tracking-widest z-[1000]">
              ðŸ“ Click map to refine marker
            </div>
            <MapContainer center={coords} zoom={15} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={coords} icon={DefaultIcon} />
              <MapEventsHandler />
            </MapContainer>
          </div>

          {zone && zone.zoneName && (
            <div className="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
              <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Target Safety Zone:</span>
              <span className="bg-blue-50 text-blue-600 font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md border border-blue-100">
                ðŸ—ºï¸ {zone.zoneName} District
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50/50 p-8 text-center text-gray-400 dark:text-gray-500 text-xs font-bold leading-normal transition-all hover:bg-gray-50 dark:bg-gray-800/50">
          ðŸ“ Type an address above or drag map to place a precise incident coordinate pin.
        </div>
      )}
    </div>
  );
}

