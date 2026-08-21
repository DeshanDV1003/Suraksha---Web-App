/**
 * SURAKSHA — STRESS TEST
 * Ramps to 200 VUs to find the breaking point.
 *
 * Run: k6 run tests/load/stress-test.js
 */

import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { Rate } from 'k6/metrics';

const BASE = 'http://localhost:3001';
const LOGIN_EMAIL = 'testload@suraksha.lk';
const LOGIN_PASS  = 'LoadTest@2026';

const errorRate = new Rate('error_rate');

export const options = {
  stages: [
    { duration: '2m', target: 50  },   // warm up
    { duration: '3m', target: 100 },   // normal load
    { duration: '3m', target: 150 },   // ramp to stress
    { duration: '3m', target: 200 },   // maximum stress
    { duration: '2m', target: 0   },   // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],  // relaxed for stress scenario
    http_req_failed:   ['rate<0.05'],   // allow up to 5% failures
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

  // Hit the heavier endpoints
  group('Login Stress', () => {
    const res = http.post(`${BASE}/api/auth/login`, JSON.stringify({
      email: LOGIN_EMAIL, password: LOGIN_PASS,
    }), { headers: { 'Content-Type': 'application/json' } });
    const ok = check(res, { 'login ok': r => r.status === 200 });
    errorRate.add(!ok);
  });

  sleep(0.3);

  group('Dashboard Stats', () => {
    const res = http.get(`${BASE}/api/dashboard/stats`, { headers });
    const ok = check(res, { 'stats ok': r => r.status === 200 });
    errorRate.add(!ok);
  });

  sleep(0.3);

  group('Water Predictions Heavy', () => {
    const res = http.get(`${BASE}/api/water/predictions`, { headers });
    const ok = check(res, { 'predictions ok': r => r.status === 200 });
    errorRate.add(!ok);
  });

  sleep(0.3);

  group('Missing Persons', () => {
    const res = http.get(`${BASE}/api/missing-persons/public`);
    const ok = check(res, { 'missing ok': r => r.status === 200 });
    errorRate.add(!ok);
  });

  sleep(0.5);
}
