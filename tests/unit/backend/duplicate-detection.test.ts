import { describe, it, expect, vi } from 'vitest';

// This service instantiates Prisma at import time — stub it out.
vi.mock('../../../backend/src/utils/prisma', () => ({
  default: new Proxy({}, { get: () => () => Promise.resolve(undefined) }),
}));

import { __test__ } from '../../../backend/src/services/duplicateDetectionService';

const { haversineMetres, nlpEntityOverlap } = __test__;

describe('haversineMetres', () => {
  it('is zero for identical points', () => {
    expect(haversineMetres(6.9271, 79.8612, 6.9271, 79.8612)).toBe(0);
  });

  it('matches the known Colombo → Kandy great-circle distance (~94 km)', () => {
    const d = haversineMetres(6.9271, 79.8612, 7.2906, 80.6337);
    expect(d).toBeGreaterThan(90_000);
    expect(d).toBeLessThan(98_000);
  });

  it('is symmetric', () => {
    const a = haversineMetres(6.0, 80.0, 7.0, 81.0);
    const b = haversineMetres(7.0, 81.0, 6.0, 80.0);
    expect(a).toBeCloseTo(b, 6);
  });

  it('grows monotonically with separation', () => {
    const near = haversineMetres(6.9, 79.9, 6.91, 79.9);
    const far = haversineMetres(6.9, 79.9, 6.95, 79.9);
    expect(far).toBeGreaterThan(near);
  });
});

describe('nlpEntityOverlap', () => {
  it('returns 0 when either side is empty or nullish', () => {
    expect(nlpEntityOverlap(null, [{ text: 'Colombo' }])).toBe(0);
    expect(nlpEntityOverlap([], [{ text: 'Colombo' }])).toBe(0);
    expect(nlpEntityOverlap([{ text: 'Colombo' }], [])).toBe(0);
  });

  it('returns 1 for identical entity arrays', () => {
    const ents = [{ text: 'Colombo' }, { text: 'flood' }];
    expect(nlpEntityOverlap(ents, ents)).toBe(1);
  });

  it('is case-insensitive', () => {
    expect(
      nlpEntityOverlap([{ text: 'COLOMBO' }], [{ text: 'colombo' }]),
    ).toBe(1);
  });

  it('scores partial overlap as intersection / max(setA, setB)', () => {
    const a = [{ text: 'Colombo' }, { text: 'flood' }];
    const b = [{ text: 'Colombo' }, { text: 'landslide' }, { text: 'road' }];
    // shared: "colombo" (1); max size = 3  -> 1/3
    expect(nlpEntityOverlap(a, b)).toBeCloseTo(1 / 3, 6);
  });

  it('reads both `text` and `value` fields', () => {
    expect(
      nlpEntityOverlap([{ value: 'Gampaha' }], [{ text: 'gampaha' }]),
    ).toBe(1);
  });
});
