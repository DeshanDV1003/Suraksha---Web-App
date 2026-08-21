/**
 * SURAKSHA — SPIKE TEST
 * Sudden burst to 300 VUs, then immediate drop.
 * Tests system recovery after a traffic spike (e.g. a major disaster event).
 *
 * Run: k6 run tests/load/spike-test.js
 */

import http from 'k6/http';
import { sleep, check } from 'k6';
import { Rate } from 'k6/metrics';

const BASE = 'http://localhost:3001';
const LOGIN_EMAIL = 'testload@suraksha.lk';
const LOGIN_PASS  = 'LoadTest@2026';

const errorRate = new Rate('error_rate');

export const options = {
  stages: [
    { duration: '30s', target: 10  },  // baseline
    { duration: '10s', target: 300 },  // spike!
    { duration: '2m',  target: 300 },  // hold spike
    { duration: '10s', target: 10  },  // drop back
    { duration: '1m',  target: 10  },  // recovery check
    { duration: '30s', target: 0   },  // ramp down
  ],
  thresholds: {
    http_req_failed: ['rate<0.10'],    // allow up to 10% errors during spike
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

  // Mixed load during spike — alerts and water are highest traffic during real disaster
  const endpoints = [
    `${BASE}/api/alerts`,
    `${BASE}/api/water/river`,
    `${BASE}/api/water/predictions`,
    `${BASE}/api/camps`,
    `${BASE}/api/dashboard/stats`,
  ];

  const url = endpoints[Math.floor(Math.random() * endpoints.length)];
  const res = http.get(url, { headers });
  const ok = check(res, {
    'ok':         r => r.status === 200,
    'not 500':    r => r.status !== 500,
    'not 503':    r => r.status !== 503,
  });
  errorRate.add(!ok);

  sleep(0.2);
}
