/**
 * SURAKSHA — LOAD TEST (Baseline)
 * 100 Virtual Users for 5 minutes
 * Tests the most-used endpoints under normal load.
 *
 * Run: k6 run tests/k6/load-test.js
 * With HTML report: k6 run --out html=load-report.html tests/k6/load-test.js
 */

import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE = 'http://localhost:3001';
const LOGIN_EMAIL = 'testload@suraksha.lk';
const LOGIN_PASS  = 'LoadTest@2026';

// Custom metrics
const errorRate      = new Rate('error_rate');
const alertDuration  = new Trend('alert_list_duration');
const waterDuration  = new Trend('water_predictions_duration');
const dashDuration   = new Trend('dashboard_stats_duration');

export const options = {
  stages: [
    { duration: '1m', target: 25  },   // ramp up
    { duration: '3m', target: 100 },   // hold at 100 VUs
    { duration: '1m', target: 0   },   // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1500'],  // 95% of requests under 1.5s
    http_req_failed:   ['rate<0.01'],   // less than 1% errors
    error_rate:        ['rate<0.01'],
  },
};

// Runs once per VU to get an auth token
export function setup() {
  const res = http.post(`${BASE}/api/auth/login`, JSON.stringify({
    email: LOGIN_EMAIL, password: LOGIN_PASS,
  }), { headers: { 'Content-Type': 'application/json' } });

  if (res.status !== 200) {
    console.error(`Login failed: ${res.status} ${res.body}`);
    return { token: null };
  }
  return { token: JSON.parse(res.body).token };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${data.token}`,
  };

  group('Dashboard Stats', () => {
    const res = http.get(`${BASE}/api/dashboard/stats`, { headers });
    dashDuration.add(res.timings.duration);
    const ok = check(res, { 'stats 200': r => r.status === 200 });
    errorRate.add(!ok);
  });

  sleep(0.5);

  group('Alert List', () => {
    const res = http.get(`${BASE}/api/alerts`, { headers });
    alertDuration.add(res.timings.duration);
    const ok = check(res, {
      'alerts 200':   r => r.status === 200,
      'alerts array': r => Array.isArray(JSON.parse(r.body)),
    });
    errorRate.add(!ok);
  });

  sleep(0.5);

  group('Water River Levels', () => {
    const res = http.get(`${BASE}/api/water/river`, { headers });
    const ok = check(res, { 'river 200': r => r.status === 200 });
    errorRate.add(!ok);
  });

  sleep(0.5);

  group('Water Predictions', () => {
    const res = http.get(`${BASE}/api/water/predictions`, { headers });
    waterDuration.add(res.timings.duration);
    const ok = check(res, { 'predictions 200': r => r.status === 200 });
    errorRate.add(!ok);
  });

  sleep(0.5);

  group('Incidents List', () => {
    const res = http.get(`${BASE}/api/incidents`, { headers });
    const ok = check(res, { 'incidents 200': r => r.status === 200 });
    errorRate.add(!ok);
  });

  sleep(1);
}
