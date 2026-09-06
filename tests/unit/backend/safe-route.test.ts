import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../backend/src/utils/prisma', () => ({
  default: new Proxy({}, { get: () => () => Promise.resolve(undefined) }),
}));

import { __test__ } from '../../../backend/src/services/safeRouteService';

const { haversineM, totalKm, generateRoute, scoreRoute, riskLabel } = __test__;

describe('haversineM', () => {
  it('is zero for the same point and ~94 km Colombo → Kandy', () => {
    expect(haversineM(7, 80, 7, 80)).toBe(0);
    const d = haversineM(6.9271, 79.8612, 7.2906, 80.6337);
    expect(d).toBeGreaterThan(90_000);
    expect(d).toBeLessThan(98_000);
  });
});

describe('totalKm', () => {
  it('is 0 for a single waypoint', () => {
    expect(totalKm([[6.9, 79.9]])).toBe(0);
  });

  it('sums leg distances and rounds to 0.1 km', () => {
    const km = totalKm([
      [6.9271, 79.8612],
      [7.2906, 80.6337],
      [6.9271, 79.8612],
    ]);
    // there and back ~ 2 x 94 km
    expect(km).toBeGreaterThan(185);
    expect(km).toBeLessThan(195);
    expect(km * 10).toBeCloseTo(Math.round(km * 10), 6); // 1-dp rounded
  });
});

describe('generateRoute', () => {
  it('returns the requested number of points, anchored at both endpoints', () => {
    const from: [number, number] = [6.9271, 79.8612];
    const to: [number, number] = [7.2906, 80.6337];
    const pts = generateRoute(from, to, 0, 12);

    expect(pts).toHaveLength(12);
    expect(pts[0][0]).toBeCloseTo(from[0], 6);
    expect(pts[0][1]).toBeCloseTo(from[1], 6);
    expect(pts.at(-1)![0]).toBeCloseTo(to[0], 6);
    expect(pts.at(-1)![1]).toBeCloseTo(to[1], 6);
  });

  it('with zero deviation the midpoint sits on the straight line', () => {
    const from: [number, number] = [0, 0];
    const to: [number, number] = [10, 10];
    const pts = generateRoute(from, to, 0, 11);
    const mid = pts[5];
    expect(mid[0]).toBeCloseTo(5, 5);
    expect(mid[1]).toBeCloseTo(5, 5);
  });

  it('a non-zero deviation pushes the path off the straight line', () => {
    const from: [number, number] = [0, 0];
    const to: [number, number] = [10, 10];
    const straight = generateRoute(from, to, 0, 11)[5];
    const bent = generateRoute(from, to, 2, 11)[5];
    const shift = Math.hypot(bent[0] - straight[0], bent[1] - straight[1]);
    expect(shift).toBeGreaterThan(0.5);
  });
});

describe('scoreRoute', () => {
  const path: [number, number][] = [
    [6.90, 79.90],
    [6.95, 79.95],
    [7.00, 80.00],
  ];

  it('scores a hazard-free route at 100 (safest)', () => {
    const { score, hazardsNearby } = scoreRoute(path, []);
    expect(score).toBe(100);
    expect(hazardsNearby).toEqual([]);
  });

  it('drops the score and reports the hazard when one sits on the path', () => {
    const hazard = {
      id: 'h1', name: 'Flooded bridge', type: 'FLOOD' as const,
      severity: 'HIGH', lat: 6.95, lng: 79.95, radiusM: 2000, maxPenalty: 60,
    };
    const { score, hazardsNearby } = scoreRoute(path, [hazard]);
    expect(score).toBeLessThan(100);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(hazardsNearby).toHaveLength(1);
    expect(hazardsNearby[0]).toMatchObject({ name: 'Flooded bridge', type: 'FLOOD' });
  });

  it('ignores hazards outside their influence radius', () => {
    const farHazard = {
      id: 'h2', name: 'Distant', type: 'INCIDENT' as const,
      severity: 'LOW', lat: 9.0, lng: 81.0, radiusM: 500, maxPenalty: 100,
    };
    expect(scoreRoute(path, [farHazard]).score).toBe(100);
  });
});

describe('riskLabel', () => {
  it('maps scores to the documented bands', () => {
    expect(riskLabel(100)).toBe('LOW');
    expect(riskLabel(80)).toBe('LOW');
    expect(riskLabel(79)).toBe('MODERATE');
    expect(riskLabel(60)).toBe('MODERATE');
    expect(riskLabel(59)).toBe('HIGH');
    expect(riskLabel(40)).toBe('HIGH');
    expect(riskLabel(39)).toBe('CRITICAL');
    expect(riskLabel(0)).toBe('CRITICAL');
  });
});
