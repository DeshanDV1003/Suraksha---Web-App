import axios from 'axios';

const SRI_LANKA_BOUNDS = {
  minLat: 5.9,
  maxLat: 9.9,
  minLng: 79.5,
  maxLng: 81.9
};

export function isInSriLanka(lat: number, lng: number): boolean {
  return (
    lat >= SRI_LANKA_BOUNDS.minLat && lat <= SRI_LANKA_BOUNDS.maxLat &&
    lng >= SRI_LANKA_BOUNDS.minLng && lng <= SRI_LANKA_BOUNDS.maxLng
  );
}

export interface GeocodeResult {
  success: boolean;
  latitude?: number;
  longitude?: number;
  displayName?: string;
  confidence?: number;
  source?: string;
  error?: string;
}

export async function geocodeAddress(addressText: string): Promise<GeocodeResult> {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: `${addressText}, Sri Lanka`,
        countrycodes: 'lk',
        format: 'json',
        limit: 1,
        addressdetails: 1
      },
      headers: { 'User-Agent': 'Suraksha-DisasterApp/1.0' },
      timeout: 5000
    });

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);

      if (isInSriLanka(lat, lng)) {
        return {
          success: true,
          latitude: lat,
          longitude: lng,
          displayName: result.display_name,
          confidence: parseFloat(result.importance) || 0.7,
          source: 'nominatim'
        };
      }
    }
  } catch (err: any) {
    console.warn('Nominatim geocoding failed:', err.message);
  }

  if (process.env.MAPBOX_TOKEN) {
    try {
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(addressText)}.json`,
        {
          params: {
            country: 'LK',
            access_token: process.env.MAPBOX_TOKEN,
            limit: 1
          },
          timeout: 5000
        }
      );

      if (response.data && response.data.features && response.data.features.length > 0) {
        const feature = response.data.features[0];
        const [lng, lat] = feature.center;

        if (isInSriLanka(lat, lng)) {
          return {
            success: true,
            latitude: lat,
            longitude: lng,
            displayName: feature.place_name,
            confidence: feature.relevance || 0.7,
            source: 'mapbox'
          };
        }
      }
    } catch (err: any) {
      console.warn('Mapbox geocoding failed:', err.message);
    }
  }

  return { success: false, error: 'Could not resolve address to coordinates inside Sri Lanka' };
}

export async function reverseGeocode(lat: number, lng: number): Promise<any> {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: { lat, lon: lng, format: 'json', addressdetails: 1 },
      headers: { 'User-Agent': 'Suraksha-DisasterApp/1.0' },
      timeout: 5000
    });
    return response.data.address || {};
  } catch (err: any) {
    console.warn('Reverse geocoding failed:', err.message);
    return {};
  }
}
