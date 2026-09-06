import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('axios');
import axios from 'axios';
import {
  isInSriLanka,
  geocodeAddress,
  reverseGeocode,
} from '../../../backend/src/services/geocodingService';

const mockedGet = vi.mocked(axios.get);

describe('isInSriLanka', () => {
  it('accepts coordinates inside the Sri Lanka bounding box', () => {
    expect(isInSriLanka(6.9271, 79.8612)).toBe(true); // Colombo
    expect(isInSriLanka(9.6615, 80.0255)).toBe(true); // Jaffna
  });

  it('rejects coordinates outside the box', () => {
    expect(isInSriLanka(13.0827, 80.2707)).toBe(false); // Chennai, India
    expect(isInSriLanka(0, 0)).toBe(false);
    expect(isInSriLanka(6.9271, 100)).toBe(false);
  });

  it('treats the box edges as inclusive', () => {
    expect(isInSriLanka(5.9, 79.5)).toBe(true);
    expect(isInSriLanka(9.9, 81.9)).toBe(true);
    expect(isInSriLanka(5.89, 79.5)).toBe(false);
  });
});

describe('geocodeAddress', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns coordinates from Nominatim when the hit is inside Sri Lanka', async () => {
    mockedGet.mockResolvedValueOnce({
      data: [
        { lat: '6.9271', lon: '79.8612', display_name: 'Colombo', importance: 0.55 },
      ],
    } as any);

    const result = await geocodeAddress('Colombo Fort');
    expect(result).toMatchObject({
      success: true,
      latitude: 6.9271,
      longitude: 79.8612,
      source: 'nominatim',
    });
  });

  it('fails gracefully when Nominatim returns a hit outside Sri Lanka', async () => {
    mockedGet.mockResolvedValueOnce({
      data: [{ lat: '13.08', lon: '80.27', display_name: 'Chennai', importance: 0.9 }],
    } as any);

    const result = await geocodeAddress('Chennai');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Sri Lanka/i);
  });

  it('fails gracefully when the geocoding request throws', async () => {
    mockedGet.mockRejectedValueOnce(new Error('network down'));
    const result = await geocodeAddress('anywhere');
    expect(result.success).toBe(false);
  });
});

describe('reverseGeocode', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the address object on success', async () => {
    mockedGet.mockResolvedValueOnce({
      data: { address: { city: 'Kandy', country: 'Sri Lanka' } },
    } as any);
    await expect(reverseGeocode(7.2906, 80.6337)).resolves.toEqual({
      city: 'Kandy',
      country: 'Sri Lanka',
    });
  });

  it('returns an empty object when the request fails', async () => {
    mockedGet.mockRejectedValueOnce(new Error('timeout'));
    await expect(reverseGeocode(0, 0)).resolves.toEqual({});
  });
});
