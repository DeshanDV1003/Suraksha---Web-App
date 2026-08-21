/**
 * SURAKSHA — SOAK TEST (30 minutes)
 * 50 VUs for 30 minutes — detects memory leaks, connection pool exhaustion,
 * and gradual degradation that only appears over time.
 *
 * Run: k6 run tests/load/soak-test.js
 * (takes 32 minutes — run before leaving for lunch)
 */

import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE = 'http://localhost:3001';
const LOGIN_EMAIL = 'testload@suraksha.lk';
const LOGIN_PASS  = 'LoadTest@2026';

const errorRate   = new Rate('error_rate');
const p95Trend    = new Trend('response_duration_over_time');

export const options = {
  stages: [
    { duration: '1m',  target: 50 },   // ramp up
    { duration: '30m', target: 50 },   // sustained load
    { duration: '1m',  target: 0  },   // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // p95 must stay under 2s throughout
    http_req_failed:   ['rate<0.01'],
    error_rate:        ['rate<0.01'],
  },
};

export function setup() {
  const res = http.post(`${BASE}/api/auth/login`, JSON.stringify({
    email: LOGIN_EMAIL, password: LOGIN_PASS,
  }), { headers: { 'Content-Type': 'application/json' } });
  return { token: res.status === 200 ? JSON.parse(res.body).token : null };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${data.token}`,
  };

  group('Mixed realistic traffic', () => {
    // Simulate a real user session pattern
    let res;

    res = http.get(`${BASE}/api/alerts`, { headers });
    p95Trend.add(res.timings.duration);
    errorRate.add(!check(res, { 'alerts': r => r.status === 200 }));
    sleep(1);

    res = http.get(`${BASE}/api/water/river`, { headers });
    p95Trend.add(res.timings.duration);
    errorRate.add(!check(res, { 'river': r => r.status === 200 }));
    sleep(1);

    res = http.get(`${BASE}/api/incidents`, { headers });
    errorRate.add(!check(res, { 'incidents': r => r.status === 200 }));
    sleep(2);

    res = http.get(`${BASE}/api/dashboard/stats`, { headers });
    p95Trend.add(res.timings.duration);
    errorRate.add(!check(res, { 'dashboard': r => r.status === 200 }));
    sleep(1);

    res = http.get(`${BASE}/api/camps`, { headers });
    errorRate.add(!check(res, { 'camps': r => r.status === 200 }));
    sleep(1);

    res = http.get(`${BASE}/api/water/predictions`, { headers });
    p95Trend.add(res.timings.duration);
    errorRate.add(!check(res, { 'predictions': r => r.status === 200 }));
    sleep(2);

    res = http.get(`${BASE}/api/missing-persons/public`);
    errorRate.add(!check(res, { 'missing': r => r.status === 200 }));
    sleep(1);
  });
}
