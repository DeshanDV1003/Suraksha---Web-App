import ExcelJS from 'exceljs';
import path from 'path';

interface TestCase {
  id: string;
  module: string;
  testName: string;
  description: string;
  preconditions: string;
  steps: string;
  expectedResult: string;
  priority: 'High' | 'Medium' | 'Low';
  type: 'Functional' | 'Negative' | 'Security' | 'Performance' | 'Integration';
  status: 'Not Tested' | 'Pass' | 'Fail';
}

const TEST_CASES: TestCase[] = [
  // ── AUTHENTICATION (TC-001 to TC-012) ──────────────────────────────────────
  {
    id: 'TC-001', module: 'Authentication', testName: 'Successful Citizen Login',
    description: 'Verify a registered citizen can log in with correct credentials.',
    preconditions: 'A citizen account exists with email: citizen@test.com, password: Test@1234',
    steps: '1. POST /api/auth/login\n2. Body: { "email": "citizen@test.com", "password": "Test@1234" }\n3. Check response',
    expectedResult: 'HTTP 200. Response contains { token: "...", user: { role: "CITIZEN" } }',
    priority: 'High', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-002', module: 'Authentication', testName: 'Login with Wrong Password',
    description: 'Verify login fails when wrong password is provided.',
    preconditions: 'A citizen account exists with email: citizen@test.com',
    steps: '1. POST /api/auth/login\n2. Body: { "email": "citizen@test.com", "password": "WrongPass" }\n3. Check response',
    expectedResult: 'HTTP 401. Response: { error: "Invalid credentials" }',
    priority: 'High', type: 'Negative', status: 'Not Tested',
  },
  {
    id: 'TC-003', module: 'Authentication', testName: 'Login with Non-Existent Email',
    description: 'Verify login fails when email does not exist in the system.',
    preconditions: 'Backend is running.',
    steps: '1. POST /api/auth/login\n2. Body: { "email": "nobody@noexist.com", "password": "Test@1234" }\n3. Check response',
    expectedResult: 'HTTP 401. Response: { error: "Invalid credentials" }',
    priority: 'High', type: 'Negative', status: 'Not Tested',
  },
  {
    id: 'TC-004', module: 'Authentication', testName: 'Citizen Registration – Valid Data',
    description: 'Verify a new citizen can register with valid details.',
    preconditions: 'Email not already registered.',
    steps: '1. POST /api/auth/register\n2. Body: { name, email, password, phone, role: "CITIZEN" }\n3. Check response',
    expectedResult: 'HTTP 201. Response contains token and user object with role CITIZEN.',
    priority: 'High', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-005', module: 'Authentication', testName: 'Registration – Duplicate Email',
    description: 'Verify registration is rejected for an already-used email.',
    preconditions: 'Email citizen@test.com is already registered.',
    steps: '1. POST /api/auth/register\n2. Body: { email: "citizen@test.com", ... }\n3. Check response',
    expectedResult: 'HTTP 409 or 400. Response contains error about duplicate email.',
    priority: 'High', type: 'Negative', status: 'Not Tested',
  },
  {
    id: 'TC-006', module: 'Authentication', testName: 'Registration – Missing Required Fields',
    description: 'Verify registration fails if required fields (name, password) are missing.',
    preconditions: 'Backend is running.',
    steps: '1. POST /api/auth/register\n2. Body: { email: "x@x.com" } (no name/password)\n3. Check response',
    expectedResult: 'HTTP 400. Response contains validation error.',
    priority: 'Medium', type: 'Negative', status: 'Not Tested',
  },
  {
    id: 'TC-007', module: 'Authentication', testName: 'Access Protected Route Without Token',
    description: 'Verify unauthenticated requests to protected routes are rejected.',
    preconditions: 'Backend is running.',
    steps: '1. GET /api/users/me\n2. No Authorization header\n3. Check response',
    expectedResult: 'HTTP 401. Response: { error: "No token provided" } or similar.',
    priority: 'High', type: 'Security', status: 'Not Tested',
  },
  {
    id: 'TC-008', module: 'Authentication', testName: 'Access Protected Route With Invalid Token',
    description: 'Verify a forged or expired JWT is rejected.',
    preconditions: 'Backend is running.',
    steps: '1. GET /api/users/me\n2. Authorization: Bearer invalid.token.here\n3. Check response',
    expectedResult: 'HTTP 401. Token rejected.',
    priority: 'High', type: 'Security', status: 'Not Tested',
  },
  {
    id: 'TC-009', module: 'Authentication', testName: 'Volunteer Login with Role Code',
    description: 'Verify a volunteer can register and log in using the volunteer role code.',
    preconditions: 'Role code VOL-2026-ACTIVE is configured.',
    steps: '1. POST /api/auth/register with roleCode: "VOL-2026-ACTIVE", role: "VOLUNTEER"\n2. POST /api/auth/login with same credentials',
    expectedResult: 'HTTP 200 on login. user.role === "VOLUNTEER".',
    priority: 'High', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-010', module: 'Authentication', testName: 'DMC Officer Login',
    description: 'Verify a DMC officer can log in and receives correct role.',
    preconditions: 'DMC officer account exists.',
    steps: '1. POST /api/auth/login with DMC credentials\n2. Check response',
    expectedResult: 'HTTP 200. user.role === "DMC_OFFICER" or "ADMIN".',
    priority: 'High', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-011', module: 'Authentication', testName: 'SQL Injection in Login Email',
    description: 'Verify the login endpoint is protected against SQL injection.',
    preconditions: 'Backend is running.',
    steps: '1. POST /api/auth/login\n2. Body: { email: "admin\'--", password: "x" }\n3. Check response',
    expectedResult: 'HTTP 400 or 401. No server error or data leak. DB not affected.',
    priority: 'High', type: 'Security', status: 'Not Tested',
  },
  {
    id: 'TC-012', module: 'Authentication', testName: 'Get My Profile (GET /api/users/me)',
    description: 'Verify authenticated user can retrieve their own profile.',
    preconditions: 'Valid JWT token for a registered user.',
    steps: '1. GET /api/users/me\n2. Authorization: Bearer <valid_token>\n3. Check response',
    expectedResult: 'HTTP 200. Response contains user id, name, email, role fields.',
    priority: 'High', type: 'Functional', status: 'Not Tested',
  },

  // ── ALERTS (TC-013 to TC-022) ───────────────────────────────────────────────
  {
    id: 'TC-013', module: 'Alerts', testName: 'List All Active Alerts',
    description: 'Verify the alerts list endpoint returns active alerts.',
    preconditions: 'At least one active alert exists in the database.',
    steps: '1. GET /api/alerts\n2. Authorization: Bearer <citizen_token>\n3. Check response',
    expectedResult: 'HTTP 200. Response is an array. Each item has id, title, message, type, active fields.',
    priority: 'High', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-014', module: 'Alerts', testName: 'Create New Alert (Admin)',
    description: 'Verify a DMC officer/admin can create a new alert.',
    preconditions: 'Valid DMC officer JWT. Alert does not already exist.',
    steps: '1. POST /api/alerts\n2. Body: { title, message, type: "EMERGENCY", locations: ["Colombo"] }\n3. Authorization: Bearer <officer_token>',
    expectedResult: 'HTTP 201. Response contains created alert with id, active: true.',
    priority: 'High', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-015', module: 'Alerts', testName: 'Create Alert Without Auth',
    description: 'Verify unauthenticated users cannot create alerts.',
    preconditions: 'Backend is running.',
    steps: '1. POST /api/alerts\n2. No Authorization header\n3. Body: { title, message, type: "EMERGENCY" }',
    expectedResult: 'HTTP 401. Alert not created.',
    priority: 'High', type: 'Security', status: 'Not Tested',
  },
  {
    id: 'TC-016', module: 'Alerts', testName: 'Create Alert as Citizen (Forbidden)',
    description: 'Verify a citizen cannot create system alerts.',
    preconditions: 'Valid citizen JWT.',
    steps: '1. POST /api/alerts\n2. Authorization: Bearer <citizen_token>\n3. Body: { title, message, type: "EMERGENCY" }',
    expectedResult: 'HTTP 403. Access denied.',
    priority: 'High', type: 'Security', status: 'Not Tested',
  },
  {
    id: 'TC-017', module: 'Alerts', testName: 'Get Single Alert by ID',
    description: 'Verify a specific alert can be retrieved by its ID.',
    preconditions: 'Alert with known ID exists.',
    steps: '1. GET /api/alerts/:id\n2. Authorization: Bearer <token>\n3. Check response',
    expectedResult: 'HTTP 200. Response contains the alert matching the requested ID.',
    priority: 'Medium', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-018', module: 'Alerts', testName: 'Get Non-Existent Alert',
    description: 'Verify a 404 is returned for an alert ID that does not exist.',
    preconditions: 'Backend is running.',
    steps: '1. GET /api/alerts/nonexistent-id-00000\n2. Authorization: Bearer <token>',
    expectedResult: 'HTTP 404. Response: { error: "Alert not found" }',
    priority: 'Medium', type: 'Negative', status: 'Not Tested',
  },
  {
    id: 'TC-019', module: 'Alerts', testName: 'Deactivate Alert',
    description: 'Verify a DMC officer can deactivate an active alert.',
    preconditions: 'An active alert exists. Valid officer token.',
    steps: '1. PATCH /api/alerts/:id/deactivate\n2. Authorization: Bearer <officer_token>',
    expectedResult: 'HTTP 200. Response shows active: false for the alert.',
    priority: 'High', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-020', module: 'Alerts', testName: 'Demo Alert Endpoint',
    description: 'Verify the presentation demo alert triggers successfully and fires the full alert pipeline.',
    preconditions: 'At least one river gauge in the database. Valid officer token.',
    steps: '1. POST /api/water/demo-alert\n2. Authorization: Bearer <officer_token>\n3. No body required',
    expectedResult: 'HTTP 200. Response: { success: true, gauge, district, demoLevel, alertId }',
    priority: 'High', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-021', module: 'Alerts', testName: 'Alert Contains Required Fields',
    description: 'Verify all returned alerts have mandatory fields populated.',
    preconditions: 'At least 5 alerts exist.',
    steps: '1. GET /api/alerts\n2. Inspect each item in the response array',
    expectedResult: 'Every item has: id, title, message, type, active, createdAt. No null/undefined on required fields.',
    priority: 'Medium', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-022', module: 'Alerts', testName: 'Alert List Performance',
    description: 'Verify the alerts list endpoint responds within acceptable time under normal load.',
    preconditions: 'Backend is running. At least 50 alerts in DB.',
    steps: '1. GET /api/alerts\n2. Measure response time\n3. Repeat 10 times',
    expectedResult: 'Average response time < 500 ms. No timeouts.',
    priority: 'Medium', type: 'Performance', status: 'Not Tested',
  },

  // ── INCIDENTS (TC-023 to TC-034) ────────────────────────────────────────────
  {
    id: 'TC-023', module: 'Incidents', testName: 'Citizen Reports an Incident',
    description: 'Verify a citizen can successfully submit an incident report.',
    preconditions: 'Valid citizen JWT.',
    steps: '1. POST /api/incidents\n2. Body: { title, description, category: "FLOOD", latitude, longitude }\n3. Authorization: Bearer <citizen_token>',
    expectedResult: 'HTTP 201. Response contains incident id, status: "PENDING".',
    priority: 'High', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-024', module: 'Incidents', testName: 'Report Incident Without Location',
    description: 'Verify incident report is rejected without latitude/longitude.',
    preconditions: 'Valid citizen JWT.',
    steps: '1. POST /api/incidents\n2. Body: { title, description, category: "FLOOD" } — no lat/lng',
    expectedResult: 'HTTP 400. Validation error about missing location.',
    priority: 'Medium', type: 'Negative', status: 'Not Tested',
  },
  {
    id: 'TC-025', module: 'Incidents', testName: 'List All Incidents (Officer)',
    description: 'Verify an officer can retrieve all incident reports.',
    preconditions: 'Valid officer JWT. At least 3 incidents in DB.',
    steps: '1. GET /api/incidents\n2. Authorization: Bearer <officer_token>',
    expectedResult: 'HTTP 200. Array of incident objects. Each has id, title, status, category.',
    priority: 'High', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-026', module: 'Incidents', testName: 'Update Incident Status',
    description: 'Verify an officer can update an incident status to IN_PROGRESS.',
    preconditions: 'Incident in PENDING status exists. Valid officer JWT.',
    steps: '1. PATCH /api/incidents/:id/status\n2. Body: { status: "IN_PROGRESS" }\n3. Authorization: Bearer <officer_token>',
    expectedResult: 'HTTP 200. Incident status updated to IN_PROGRESS.',
    priority: 'High', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-027', module: 'Incidents', testName: 'Citizen Cannot Update Incident Status',
    description: 'Verify a citizen cannot change incident status.',
    preconditions: 'Valid citizen JWT. Any incident exists.',
    steps: '1. PATCH /api/incidents/:id/status\n2. Body: { status: "RESOLVED" }\n3. Authorization: Bearer <citizen_token>',
    expectedResult: 'HTTP 403. Status not changed.',
    priority: 'High', type: 'Security', status: 'Not Tested',
  },
  {
    id: 'TC-028', module: 'Incidents', testName: 'Get Single Incident by ID',
    description: 'Verify a specific incident can be retrieved by ID.',
    preconditions: 'Incident with known ID exists.',
    steps: '1. GET /api/incidents/:id\n2. Authorization: Bearer <token>',
    expectedResult: 'HTTP 200. Response matches the requested incident ID.',
    priority: 'Medium', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-029', module: 'Incidents', testName: 'Incident XSS Prevention',
    description: 'Verify incident description with XSS payload is stored safely and not executed.',
    preconditions: 'Valid citizen JWT.',
    steps: '1. POST /api/incidents\n2. Body: { description: "<script>alert(1)</script>", ... }\n3. GET the incident back',
    expectedResult: 'Response stores the description as a plain string. Script tag is not executed on retrieval.',
    priority: 'High', type: 'Security', status: 'Not Tested',
  },
  {
    id: 'TC-030', module: 'Incidents', testName: 'Filter Incidents by Category',
    description: 'Verify incidents can be filtered by disaster category.',
    preconditions: 'Incidents of multiple categories exist.',
    steps: '1. GET /api/incidents?category=FLOOD\n2. Authorization: Bearer <officer_token>',
    expectedResult: 'HTTP 200. All returned incidents have category === "FLOOD".',
    priority: 'Medium', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-031', module: 'Incidents', testName: 'Incident Count in Dashboard Stats',
    description: 'Verify the dashboard stats reflect the correct incident count.',
    preconditions: 'Known number of incidents in DB. Valid officer token.',
    steps: '1. GET /api/dashboard/stats\n2. Compare activeIncidents count to actual DB count',
    expectedResult: 'HTTP 200. activeIncidents matches the number of non-resolved incidents in DB.',
    priority: 'Medium', type: 'Integration', status: 'Not Tested',
  },
  {
    id: 'TC-032', module: 'Incidents', testName: 'Assign Incident to Volunteer',
    description: 'Verify an officer can assign an incident to a volunteer.',
    preconditions: 'Incident exists in PENDING. Volunteer user exists. Officer token.',
    steps: '1. POST /api/volunteers/assign or PATCH /api/incidents/:id/assign\n2. Body: { volunteerId }\n3. Authorization: Bearer <officer_token>',
    expectedResult: 'HTTP 200. Incident is assigned to the volunteer.',
    priority: 'High', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-033', module: 'Incidents', testName: 'Delete Incident (Admin Only)',
    description: 'Verify only admin can delete an incident.',
    preconditions: 'Admin token and officer token available. Incident exists.',
    steps: '1. DELETE /api/incidents/:id with officer token → expect 403\n2. DELETE /api/incidents/:id with admin token → expect 200',
    expectedResult: 'Officer gets HTTP 403. Admin gets HTTP 200 and incident is removed.',
    priority: 'High', type: 'Security', status: 'Not Tested',
  },
  {
    id: 'TC-034', module: 'Incidents', testName: 'Incident Submission Offline Queuing',
    description: 'Verify mobile app queues incident reports when offline and syncs when reconnected.',
    preconditions: 'Mobile app installed. Device in airplane mode.',
    steps: '1. Open mobile app in airplane mode\n2. Submit an incident report\n3. Re-enable internet\n4. Wait for sync',
    expectedResult: 'Incident queued locally. After reconnect, incident appears in the backend DB.',
    priority: 'High', type: 'Functional', status: 'Not Tested',
  },

  // ── WATER MONITORING (TC-035 to TC-045) ─────────────────────────────────────
  {
    id: 'TC-035', module: 'Water Monitoring', testName: 'Get River Water Levels',
    description: 'Verify the river water level endpoint returns current readings.',
    preconditions: 'At least one river reading in DB (simulator running).',
    steps: '1. GET /api/water/river\n2. Authorization: Bearer <token>',
    expectedResult: 'HTTP 200. Array of readings. Each has gaugeId, waterLevelMetres, status, district.',
    priority: 'High', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-036', module: 'Water Monitoring', testName: 'Get Rainfall Data',
    description: 'Verify the rainfall endpoint returns district-level rainfall readings.',
    preconditions: 'Rainfall cron has run at least once.',
    steps: '1. GET /api/water/rainfall\n2. Authorization: Bearer <token>',
    expectedResult: 'HTTP 200. Array of rainfall objects with rainfallMmPerHour, district, riskLevel.',
    priority: 'High', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-037', module: 'Water Monitoring', testName: 'Get Water Level Predictions',
    description: 'Verify predictions endpoint returns T+1hr and T+2hr forecasts for each gauge.',
    preconditions: 'At least one gauge has 6+ hourly readings.',
    steps: '1. GET /api/water/predictions\n2. Authorization: Bearer <token>',
    expectedResult: 'HTTP 200. Array of prediction objects. Each has predicted_t1_m, predicted_t2_m, confidence, alert_level.',
    priority: 'High', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-038', module: 'Water Monitoring', testName: 'Prediction Confidence Range',
    description: 'Verify all confidence values are between 0.0 and 1.0.',
    preconditions: 'Predictions endpoint returns data.',
    steps: '1. GET /api/water/predictions\n2. For each prediction, check confidence value',
    expectedResult: 'All confidence values are >= 0.0 and <= 1.0. No nulls.',
    priority: 'Medium', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-039', module: 'Water Monitoring', testName: 'ML Service Status Check',
    description: 'Verify the ML status endpoint correctly reports whether the ML service is online.',
    preconditions: 'Backend running. ML service may or may not be running.',
    steps: '1. GET /api/water/ml-status\n2. Check response',
    expectedResult: 'HTTP 200. Response has { online: true/false }. No 500 error regardless of ML state.',
    priority: 'High', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-040', module: 'Water Monitoring', testName: 'Prediction Contains Flood Thresholds',
    description: 'Verify predictions include minorFloodLevel and majorFloodLevel from the DB.',
    preconditions: 'Gauges have thresholds stored.',
    steps: '1. GET /api/water/predictions\n2. Check each prediction object',
    expectedResult: 'Every prediction has minorFloodLevel and majorFloodLevel as positive numbers.',
    priority: 'High', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-041', module: 'Water Monitoring', testName: 'Single Gauge Prediction',
    description: 'Verify a prediction for a specific gauge can be requested.',
    preconditions: 'A gauge with known gaugeId exists.',
    steps: '1. GET /api/water/predictions/:gaugeId\n2. Authorization: Bearer <token>',
    expectedResult: 'HTTP 200. Response: { latest, history, prediction } for that gauge.',
    priority: 'Medium', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-042', module: 'Water Monitoring', testName: 'Invalid Gauge ID Returns 404',
    description: 'Verify requesting prediction for a non-existent gauge returns 404.',
    preconditions: 'Backend is running.',
    steps: '1. GET /api/water/predictions/NONEXISTENT-GAUGE\n2. Authorization: Bearer <token>',
    expectedResult: 'HTTP 404. Response: { error: "Gauge not found" }',
    priority: 'Medium', type: 'Negative', status: 'Not Tested',
  },
  {
    id: 'TC-043', module: 'Water Monitoring', testName: 'Demo Alert Fires Push Notifications',
    description: 'Verify demo alert endpoint creates both an Alert record and Notification rows.',
    preconditions: 'At least one gauge exists. Officer token.',
    steps: '1. POST /api/water/demo-alert\n2. Count Alert rows before and after\n3. Count Notification rows before and after',
    expectedResult: 'Alert count increases by 1. Notification rows created for registered devices.',
    priority: 'High', type: 'Integration', status: 'Not Tested',
  },
  {
    id: 'TC-044', module: 'Water Monitoring', testName: 'Water Data Simulator Running',
    description: 'Verify the simulator populates new river readings at least once per hour.',
    preconditions: 'Backend running for > 1 hour.',
    steps: '1. Query DB: SELECT COUNT(*) from RiverWaterLevel WHERE recordedAt > NOW() - 1hr\n2. Compare to gauge count',
    expectedResult: 'At least as many new rows as the number of configured gauges.',
    priority: 'High', type: 'Integration', status: 'Not Tested',
  },
  {
    id: 'TC-045', module: 'Water Monitoring', testName: 'Downstream Mapping CRUD',
    description: 'Verify downstream district mappings can be saved and retrieved.',
    preconditions: 'Officer token.',
    steps: '1. POST /api/water/downstream-mapping with gaugeId and targetDistricts\n2. GET /api/water/downstream-mapping\n3. Verify saved mapping is returned',
    expectedResult: 'HTTP 200 on both calls. Saved mapping appears in the list.',
    priority: 'Medium', type: 'Functional', status: 'Not Tested',
  },

  // ── HELP REQUESTS (TC-046 to TC-054) ────────────────────────────────────────
  {
    id: 'TC-046', module: 'Help Requests', testName: 'Citizen Submits Help Request',
    description: 'Verify a citizen can submit a help request with location.',
    preconditions: 'Valid citizen JWT.',
    steps: '1. POST /api/help-requests\n2. Body: { requestType, description, latitude, longitude, district }\n3. Authorization: Bearer <citizen_token>',
    expectedResult: 'HTTP 201. Help request created with status PENDING.',
    priority: 'High', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-047', module: 'Help Requests', testName: 'Public Help Request (No Auth)',
    description: 'Verify the public help request endpoint works without authentication.',
    preconditions: 'Backend is running.',
    steps: '1. POST /api/help-requests/public\n2. Body: { name, phone, requestType, description, latitude, longitude }',
    expectedResult: 'HTTP 201. Request created. No token required.',
    priority: 'High', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-048', module: 'Help Requests', testName: 'Officer Lists All Help Requests',
    description: 'Verify an officer can view all submitted help requests.',
    preconditions: 'Valid officer JWT. At least 2 requests exist.',
    steps: '1. GET /api/help-requests\n2. Authorization: Bearer <officer_token>',
    expectedResult: 'HTTP 200. Array of help request objects.',
    priority: 'High', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-049', module: 'Help Requests', testName: 'Update Help Request Status',
    description: 'Verify an officer can mark a help request as DISPATCHED.',
    preconditions: 'Help request in PENDING status. Officer token.',
    steps: '1. PATCH /api/help-requests/:id/status\n2. Body: { status: "DISPATCHED" }\n3. Authorization: Bearer <officer_token>',
    expectedResult: 'HTTP 200. Status updated to DISPATCHED.',
    priority: 'High', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-050', module: 'Help Requests', testName: 'Help Request Missing Request Type',
    description: 'Verify help request fails without specifying a request type.',
    preconditions: 'Valid citizen JWT.',
    steps: '1. POST /api/help-requests\n2. Body: { description: "Need help" } — no requestType',
    expectedResult: 'HTTP 400. Validation error.',
    priority: 'Medium', type: 'Negative', status: 'Not Tested',
  },
  {
    id: 'TC-051', module: 'Help Requests', testName: 'Citizen Sees Only Own Requests',
    description: 'Verify a citizen can only access their own help requests.',
    preconditions: 'Two different citizen accounts each with one help request.',
    steps: '1. GET /api/help-requests/mine\n2. Authorization: Bearer <citizen1_token>\n3. Verify citizen2 requests not included',
    expectedResult: 'HTTP 200. Only requests belonging to the authenticated citizen are returned.',
    priority: 'High', type: 'Security', status: 'Not Tested',
  },
  {
    id: 'TC-052', module: 'Help Requests', testName: 'Help Request Geolocation Stored',
    description: 'Verify latitude and longitude are persisted correctly with the request.',
    preconditions: 'Valid citizen JWT.',
    steps: '1. POST /api/help-requests with lat: 6.9271, lng: 79.8612\n2. GET the created request by ID',
    expectedResult: 'Retrieved request has latitude: 6.9271, longitude: 79.8612.',
    priority: 'Medium', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-053', module: 'Help Requests', testName: 'SOS Alert Triggers Help Request',
    description: 'Verify sending an SOS from the mobile app creates a high-priority help request.',
    preconditions: 'Mobile app. Valid citizen JWT.',
    steps: '1. Tap SOS button in mobile app\n2. Confirm SOS dialog\n3. Check backend for new help request',
    expectedResult: 'New help request appears in backend with type SOS or MEDICAL_EMERGENCY and HIGH priority.',
    priority: 'High', type: 'Integration', status: 'Not Tested',
  },
  {
    id: 'TC-054', module: 'Help Requests', testName: 'Help Request Load – 50 Concurrent Submissions',
    description: 'Verify the system handles 50 simultaneous help request submissions.',
    preconditions: 'k6 or Artillery installed. Backend running.',
    steps: '1. Run k6 script: 50 VUs each submitting one help request\n2. Measure success rate and latency',
    expectedResult: 'Success rate >= 95%. p95 response time < 2000 ms. No 500 errors.',
    priority: 'High', type: 'Performance', status: 'Not Tested',
  },

  // ── MISSING PERSONS (TC-055 to TC-062) ──────────────────────────────────────
  {
    id: 'TC-055', module: 'Missing Persons', testName: 'Report a Missing Person',
    description: 'Verify a citizen can report a missing person.',
    preconditions: 'Valid citizen JWT.',
    steps: '1. POST /api/missing-persons\n2. Body: { name, age, description, lastSeenLocation, photo(optional) }\n3. Authorization: Bearer <citizen_token>',
    expectedResult: 'HTTP 201. Missing person record created with status MISSING.',
    priority: 'High', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-056', module: 'Missing Persons', testName: 'Public Listing of Missing Persons',
    description: 'Verify missing persons can be listed without authentication.',
    preconditions: 'At least one missing person record exists.',
    steps: '1. GET /api/missing-persons/public\n2. No Authorization header',
    expectedResult: 'HTTP 200. Array of missing persons. No sensitive data exposed.',
    priority: 'High', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-057', module: 'Missing Persons', testName: 'Mark Person as Found',
    description: 'Verify an officer can update status to FOUND.',
    preconditions: 'A MISSING record exists. Officer token.',
    steps: '1. PATCH /api/missing-persons/:id\n2. Body: { status: "FOUND" }\n3. Authorization: Bearer <officer_token>',
    expectedResult: 'HTTP 200. Status updated to FOUND.',
    priority: 'High', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-058', module: 'Missing Persons', testName: 'Search Missing Persons by Name',
    description: 'Verify missing persons can be searched by name.',
    preconditions: 'Records exist with known names.',
    steps: '1. GET /api/missing-persons?name=Kasun\n2. Check results',
    expectedResult: 'HTTP 200. Only persons with "Kasun" in name are returned.',
    priority: 'Medium', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-059', module: 'Missing Persons', testName: 'Missing Person Report Without Name',
    description: 'Verify report is rejected if person name is missing.',
    preconditions: 'Valid citizen JWT.',
    steps: '1. POST /api/missing-persons\n2. Body: { age: 30, description: "Wearing red shirt" } — no name',
    expectedResult: 'HTTP 400. Validation error for missing name field.',
    priority: 'Medium', type: 'Negative', status: 'Not Tested',
  },
  {
    id: 'TC-060', module: 'Missing Persons', testName: 'Report Missing Person with Photo',
    description: 'Verify a photo can be attached to a missing person report.',
    preconditions: 'Valid citizen JWT. Photo encoded as base64.',
    steps: '1. POST /api/missing-persons\n2. Body includes photo field with base64 JPEG',
    expectedResult: 'HTTP 201. Record created. photoUrl field is populated in the response.',
    priority: 'Medium', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-061', module: 'Missing Persons', testName: 'Officer List All Missing Persons',
    description: 'Verify officer can list all missing person records including non-public ones.',
    preconditions: 'Officer token. Records exist.',
    steps: '1. GET /api/missing-persons\n2. Authorization: Bearer <officer_token>',
    expectedResult: 'HTTP 200. Returns all records including any marked as not public.',
    priority: 'Medium', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-062', module: 'Missing Persons', testName: 'Delete Missing Person Record (Admin)',
    description: 'Verify only admin can delete a missing person record.',
    preconditions: 'Admin token. Record exists.',
    steps: '1. DELETE /api/missing-persons/:id\n2. Authorization: Bearer <admin_token>',
    expectedResult: 'HTTP 200. Record removed.',
    priority: 'Medium', type: 'Security', status: 'Not Tested',
  },

  // ── RELIEF CAMPS (TC-063 to TC-070) ─────────────────────────────────────────
  {
    id: 'TC-063', module: 'Relief Camps', testName: 'List All Active Camps',
    description: 'Verify active relief camps are listed correctly.',
    preconditions: 'At least one camp in DB.',
    steps: '1. GET /api/camps\n2. Authorization: Bearer <token>',
    expectedResult: 'HTTP 200. Array of camp objects. Each has name, district, totalCapacity, currentOccupancy.',
    priority: 'High', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-064', module: 'Relief Camps', testName: 'Create a New Camp',
    description: 'Verify an admin/officer can create a new relief camp.',
    preconditions: 'Officer token.',
    steps: '1. POST /api/camps\n2. Body: { name, district, address, totalCapacity, latitude, longitude }\n3. Authorization: Bearer <officer_token>',
    expectedResult: 'HTTP 201. Camp created with currentOccupancy: 0.',
    priority: 'High', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-065', module: 'Relief Camps', testName: 'Update Camp Occupancy',
    description: 'Verify occupancy can be updated without exceeding capacity.',
    preconditions: 'Camp with capacity 100 exists. Officer token.',
    steps: '1. PATCH /api/camps/:id\n2. Body: { currentOccupancy: 80 }',
    expectedResult: 'HTTP 200. currentOccupancy updated to 80.',
    priority: 'High', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-066', module: 'Relief Camps', testName: 'Occupancy Cannot Exceed Capacity',
    description: 'Verify occupancy update is rejected if it exceeds total capacity.',
    preconditions: 'Camp with totalCapacity: 100 exists.',
    steps: '1. PATCH /api/camps/:id\n2. Body: { currentOccupancy: 150 }',
    expectedResult: 'HTTP 400. Error: occupancy exceeds total capacity.',
    priority: 'High', type: 'Negative', status: 'Not Tested',
  },
  {
    id: 'TC-067', module: 'Relief Camps', testName: 'Camp Occupancy Zero-Capacity Guard',
    description: 'Verify occupancy percentage calculation handles zero-capacity camps safely.',
    preconditions: 'Camp with totalCapacity: 0 exists (edge case).',
    steps: '1. GET /api/camps\n2. Check if camp with 0 capacity causes a server error',
    expectedResult: 'HTTP 200. No 500 error. Occupancy % shown as 0% for that camp.',
    priority: 'Medium', type: 'Negative', status: 'Not Tested',
  },
  {
    id: 'TC-068', module: 'Relief Camps', testName: 'Deactivate a Camp',
    description: 'Verify an officer can deactivate a camp once disaster is over.',
    preconditions: 'Active camp exists. Officer token.',
    steps: '1. PATCH /api/camps/:id\n2. Body: { isActive: false }',
    expectedResult: 'HTTP 200. Camp status set to inactive. No longer appears in active list.',
    priority: 'Medium', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-069', module: 'Relief Camps', testName: 'Camp Distance Sorted in Mobile App',
    description: 'Verify camps are returned closest-first when user location is provided.',
    preconditions: 'Multiple camps in different districts.',
    steps: '1. GET /api/camps?lat=6.9271&lng=79.8612 (Colombo)\n2. Check order of results',
    expectedResult: 'Camp in Colombo district appears before camps in Matara or Jaffna.',
    priority: 'Medium', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-070', module: 'Relief Camps', testName: 'Camp List Cached on Mobile',
    description: 'Verify mobile app shows cached camp data when offline.',
    preconditions: 'Mobile app with previously loaded camp data. Device offline.',
    steps: '1. Open mobile app\n2. Enable airplane mode\n3. Navigate to Relief Camps screen',
    expectedResult: 'Previously loaded camp list is displayed from local cache. No blank screen.',
    priority: 'High', type: 'Functional', status: 'Not Tested',
  },

  // ── USERS & VOLUNTEERS (TC-071 to TC-080) ───────────────────────────────────
  {
    id: 'TC-071', module: 'Users', testName: 'Update User Profile',
    description: 'Verify a user can update their own name and phone.',
    preconditions: 'Valid citizen JWT.',
    steps: '1. PATCH /api/users/me\n2. Body: { name: "New Name", phone: "0771234567" }\n3. Authorization: Bearer <token>',
    expectedResult: 'HTTP 200. User profile updated. GET /api/users/me returns new name.',
    priority: 'High', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-072', module: 'Users', testName: 'Change Password',
    description: 'Verify a user can change their password using the correct current password.',
    preconditions: 'Valid citizen JWT. Current password known.',
    steps: '1. POST /api/auth/change-password\n2. Body: { currentPassword, newPassword }\n3. Try login with new password',
    expectedResult: 'HTTP 200 on change. Login with new password returns HTTP 200.',
    priority: 'High', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-073', module: 'Users', testName: 'Change Password – Wrong Current Password',
    description: 'Verify password change fails with wrong current password.',
    preconditions: 'Valid citizen JWT.',
    steps: '1. POST /api/auth/change-password\n2. Body: { currentPassword: "WrongOld", newPassword: "New@1234" }',
    expectedResult: 'HTTP 400 or 401. Password not changed.',
    priority: 'High', type: 'Negative', status: 'Not Tested',
  },
  {
    id: 'TC-074', module: 'Users', testName: 'Admin Lists All Users',
    description: 'Verify admin can retrieve the full user list.',
    preconditions: 'Valid admin JWT.',
    steps: '1. GET /api/users\n2. Authorization: Bearer <admin_token>',
    expectedResult: 'HTTP 200. Array of all registered users.',
    priority: 'High', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-075', module: 'Users', testName: 'Citizen Cannot List All Users',
    description: 'Verify the full user list is not accessible to citizens.',
    preconditions: 'Valid citizen JWT.',
    steps: '1. GET /api/users\n2. Authorization: Bearer <citizen_token>',
    expectedResult: 'HTTP 403. Access denied.',
    priority: 'High', type: 'Security', status: 'Not Tested',
  },
  {
    id: 'TC-076', module: 'Volunteers', testName: 'Volunteer Views Assigned Tasks',
    description: 'Verify a volunteer can see their assigned tasks.',
    preconditions: 'Volunteer JWT. At least one task assigned to this volunteer.',
    steps: '1. GET /api/volunteers/tasks/mine\n2. Authorization: Bearer <volunteer_token>',
    expectedResult: 'HTTP 200. Array of tasks assigned to this volunteer.',
    priority: 'High', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-077', module: 'Volunteers', testName: 'Volunteer Updates Task to Completed',
    description: 'Verify a volunteer can mark a task as COMPLETED.',
    preconditions: 'Task in ASSIGNED or IN_PROGRESS state. Volunteer JWT.',
    steps: '1. PATCH /api/volunteers/tasks/:taskId/status\n2. Body: { status: "COMPLETED" }\n3. Authorization: Bearer <volunteer_token>',
    expectedResult: 'HTTP 200. Task status updated to COMPLETED.',
    priority: 'High', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-078', module: 'Volunteers', testName: 'Officer Creates a Task',
    description: 'Verify an officer can create a task and assign it to a volunteer.',
    preconditions: 'Officer token. Volunteer user exists.',
    steps: '1. POST /api/volunteers/tasks\n2. Body: { title, description, assignedTo: volunteerId, incidentId }\n3. Authorization: Bearer <officer_token>',
    expectedResult: 'HTTP 201. Task created in ASSIGNED state.',
    priority: 'High', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-079', module: 'Volunteers', testName: 'Volunteer Cannot See Other Volunteers\' Tasks',
    description: 'Verify volunteer A cannot read tasks assigned to volunteer B.',
    preconditions: 'Two volunteer accounts. Tasks assigned to each.',
    steps: '1. GET /api/volunteers/tasks/mine with volunteer A token\n2. Check no tasks from volunteer B appear',
    expectedResult: 'HTTP 200. Only volunteer A\'s tasks returned.',
    priority: 'High', type: 'Security', status: 'Not Tested',
  },
  {
    id: 'TC-080', module: 'Volunteers', testName: 'Gamification Hours Update After Task Complete',
    description: 'Verify volunteer total hours increase after completing a task.',
    preconditions: 'Volunteer has completed gamification profile. Officer token.',
    steps: '1. Record volunteer\'s totalHours before\n2. Mark task as COMPLETED\n3. GET volunteer profile\n4. Compare totalHours',
    expectedResult: 'totalHours increased after task completion.',
    priority: 'Medium', type: 'Integration', status: 'Not Tested',
  },

  // ── RESOURCES & DONATIONS (TC-081 to TC-088) ────────────────────────────────
  {
    id: 'TC-081', module: 'Resources', testName: 'List Available Resources',
    description: 'Verify authenticated users can view available resources.',
    preconditions: 'Resources in DB. Valid token.',
    steps: '1. GET /api/resources\n2. Authorization: Bearer <token>',
    expectedResult: 'HTTP 200. Array with name, type, quantity, district.',
    priority: 'High', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-082', module: 'Resources', testName: 'Submit Resource Supply Request',
    description: 'Verify a citizen can request a resource supply.',
    preconditions: 'Valid citizen JWT.',
    steps: '1. POST /api/supply-requests\n2. Body: { resourceType, quantity, description, latitude, longitude }',
    expectedResult: 'HTTP 201. Supply request created.',
    priority: 'High', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-083', module: 'Resources', testName: 'Officer Updates Resource Quantity',
    description: 'Verify officer can update available resource quantity.',
    preconditions: 'Resource exists. Officer token.',
    steps: '1. PATCH /api/resources/:id\n2. Body: { quantity: 500 }',
    expectedResult: 'HTTP 200. Quantity updated.',
    priority: 'Medium', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-084', module: 'Resources', testName: 'Resource Quantity Cannot Be Negative',
    description: 'Verify resource quantity update rejects negative values.',
    preconditions: 'Resource exists.',
    steps: '1. PATCH /api/resources/:id\n2. Body: { quantity: -10 }',
    expectedResult: 'HTTP 400. Validation error. Quantity not updated.',
    priority: 'Medium', type: 'Negative', status: 'Not Tested',
  },
  {
    id: 'TC-085', module: 'Donations', testName: 'Submit a Donation Record',
    description: 'Verify a donation record can be submitted.',
    preconditions: 'Valid citizen JWT.',
    steps: '1. POST /api/donations\n2. Body: { amount, currency, donationType, message }\n3. Authorization: Bearer <citizen_token>',
    expectedResult: 'HTTP 201. Donation record created with a transactionId.',
    priority: 'High', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-086', module: 'Donations', testName: 'List Donation History',
    description: 'Verify an officer can list all donations.',
    preconditions: 'Officer token. At least 1 donation.',
    steps: '1. GET /api/donations\n2. Authorization: Bearer <officer_token>',
    expectedResult: 'HTTP 200. Array of donation objects.',
    priority: 'Medium', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-087', module: 'Donations', testName: 'Donation Amount Must Be Positive',
    description: 'Verify donation with zero or negative amount is rejected.',
    preconditions: 'Valid citizen JWT.',
    steps: '1. POST /api/donations\n2. Body: { amount: 0, currency: "LKR" }',
    expectedResult: 'HTTP 400. Validation error.',
    priority: 'Medium', type: 'Negative', status: 'Not Tested',
  },
  {
    id: 'TC-088', module: 'Donations', testName: 'Citizen Views Own Donation History',
    description: 'Verify a citizen can view only their own donation history.',
    preconditions: 'Citizen token. Donations from multiple users in DB.',
    steps: '1. GET /api/donations/mine\n2. Authorization: Bearer <citizen_token>',
    expectedResult: 'HTTP 200. Only this citizen\'s donations returned.',
    priority: 'Medium', type: 'Security', status: 'Not Tested',
  },

  // ── AI / ML ENDPOINTS (TC-089 to TC-095) ────────────────────────────────────
  {
    id: 'TC-089', module: 'AI Services', testName: 'Hotspot Forecast Returns District Risk',
    description: 'Verify the hotspot forecast endpoint returns risk scores for Sri Lanka districts.',
    preconditions: 'At least 5 incidents in the DB. Officer token.',
    steps: '1. GET /api/ai/hotspots or POST /api/ai/hotspots\n2. Authorization: Bearer <officer_token>',
    expectedResult: 'HTTP 200. Array of 25 district objects each with risk_level and adjusted_severity.',
    priority: 'High', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-090', module: 'AI Services', testName: 'Drift Detection Returns Report',
    description: 'Verify the drift detection endpoint analyses recent incidents and returns a drift report.',
    preconditions: 'At least 10 recent incidents. Officer token.',
    steps: '1. GET /api/ai/drift\n2. Authorization: Bearer <officer_token>',
    expectedResult: 'HTTP 200. Response has drift_detected, drift_score, anomalies, recommendation.',
    priority: 'High', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-091', module: 'AI Services', testName: 'NLP Process Report Endpoint',
    description: 'Verify the /process-report endpoint classifies a text report.',
    preconditions: 'ML service running (FastAPI on port 8000).',
    steps: '1. POST /api/ai/process-report\n2. Body: { text: "Heavy flooding in Colombo near Kelani River" }\n3. Authorization: Bearer <officer_token>',
    expectedResult: 'HTTP 200. Response contains category, priority, confidence, and entities.',
    priority: 'High', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-092', module: 'AI Services', testName: 'NLP Returns 503 When ML Service Down',
    description: 'Verify a user-friendly error is returned when the ML service is offline.',
    preconditions: 'ML service (port 8000) is NOT running.',
    steps: '1. POST /api/ai/process-report\n2. Body: { text: "Flood in Kandy" }',
    expectedResult: 'HTTP 503. Response: { error: "ML service unavailable" }. No raw crash stack.',
    priority: 'High', type: 'Negative', status: 'Not Tested',
  },
  {
    id: 'TC-093', module: 'AI Services', testName: 'Situation Summary Generation',
    description: 'Verify the AI situation summary generates meaningful text from current incidents.',
    preconditions: 'Active incidents in DB. Officer token.',
    steps: '1. GET /api/ai/summary\n2. Authorization: Bearer <officer_token>',
    expectedResult: 'HTTP 200. Response contains a non-empty summary string referencing current events.',
    priority: 'Medium', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-094', module: 'AI Services', testName: 'Duplicate Report Detection',
    description: 'Verify submitting a nearly identical incident triggers a duplicate warning.',
    preconditions: 'An incident with text "Flooding in Colombo 7 near Beira Lake" exists.',
    steps: '1. POST /api/incidents\n2. Body: { description: "Flood near Beira Lake Colombo 7" }\n3. Check if duplicate flag appears in response',
    expectedResult: 'Response contains isDuplicate: true or similar flag.',
    priority: 'High', type: 'Functional', status: 'Not Tested',
  },
  {
    id: 'TC-095', module: 'AI Services', testName: 'Resource Optimisation Recommendation',
    description: 'Verify the AI resource optimiser returns allocation recommendations.',
    preconditions: 'Resources and incidents in DB. Officer token.',
    steps: '1. GET /api/ai/resource-optimisation\n2. Authorization: Bearer <officer_token>',
    expectedResult: 'HTTP 200. Response contains a list of recommended resource allocations per district.',
    priority: 'Medium', type: 'Functional', status: 'Not Tested',
  },

  // ── PERFORMANCE / LOAD (TC-096 to TC-100) ────────────────────────────────────
  {
    id: 'TC-096', module: 'Performance', testName: 'Dashboard Stats Load Under 100 VUs',
    description: 'Verify the dashboard stats endpoint performs under 100 concurrent virtual users.',
    preconditions: 'k6 installed. Backend running with seeded data.',
    steps: '1. Run: k6 run tests/k6/load-test.js\n2. Target: GET /api/dashboard/stats\n3. 100 VUs, 5 minutes',
    expectedResult: 'p95 response time < 1500 ms. Error rate < 1%. Throughput > 50 req/s.',
    priority: 'High', type: 'Performance', status: 'Not Tested',
  },
  {
    id: 'TC-097', module: 'Performance', testName: 'Login Endpoint Stress Test – 200 VUs',
    description: 'Verify the login endpoint handles a spike of 200 concurrent logins.',
    preconditions: 'k6 installed. 200 test user accounts seeded.',
    steps: '1. Run: k6 run tests/k6/stress-test.js\n2. Target: POST /api/auth/login\n3. Ramp 0→200 VUs over 2 min, hold 5 min',
    expectedResult: 'p95 < 3000 ms. Error rate < 5%. No DB connection exhaustion errors.',
    priority: 'High', type: 'Performance', status: 'Not Tested',
  },
  {
    id: 'TC-098', module: 'Performance', testName: 'Water Predictions Endpoint – Spike Test',
    description: 'Verify water predictions endpoint survives a sudden traffic spike.',
    preconditions: 'k6 installed. Backend running.',
    steps: '1. Run: k6 run tests/k6/spike-test.js\n2. Target: GET /api/water/predictions\n3. Spike to 300 VUs instantly, drop after 1 min',
    expectedResult: 'System recovers after spike. Error rate < 10% during spike. No permanent hang.',
    priority: 'High', type: 'Performance', status: 'Not Tested',
  },
  {
    id: 'TC-099', module: 'Performance', testName: 'Soak Test – Backend Stable Over 30 Minutes',
    description: 'Verify the backend does not degrade or leak memory over a sustained 30-minute run.',
    preconditions: 'k6 installed. Backend running with all crons active.',
    steps: '1. Run: k6 run tests/k6/soak-test.js\n2. 50 VUs hitting mixed endpoints for 30 minutes\n3. Monitor memory usage',
    expectedResult: 'p95 stays stable throughout. Memory does not grow unboundedly. No OOM crash.',
    priority: 'High', type: 'Performance', status: 'Not Tested',
  },
  {
    id: 'TC-100', module: 'Performance', testName: 'Socket.IO Alert Broadcast to 50 Clients',
    description: 'Verify Socket.IO can broadcast a new alert to 50 simultaneously connected clients.',
    preconditions: '50 WebSocket clients connected to ws://localhost:3001. Officer token.',
    steps: '1. Connect 50 Socket.IO clients\n2. POST /api/water/demo-alert\n3. Measure time for all 50 clients to receive new-alert event',
    expectedResult: 'All 50 clients receive the event within 2 seconds. No dropped connections.',
    priority: 'High', type: 'Performance', status: 'Not Tested',
  },
];

async function generateExcel() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Suraksha System – Test Suite';
  wb.created = new Date();

  // ── Styles ──────────────────────────────────────────────────────────────────
  const COLORS = {
    headerBg:   '1F3864',  // dark navy
    headerFg:   'FFFFFF',
    moduleBg:   'D6E4F7',
    High:       { bg: 'FDEDED', fg: 'C0392B' },
    Medium:     { bg: 'FEF9E7', fg: 'B7950B' },
    Low:        { bg: 'EAFAF1', fg: '1E8449' },
    Functional: { bg: 'EBF5FB', fg: '1A5276' },
    Negative:   { bg: 'FDEDEC', fg: '922B21' },
    Security:   { bg: 'FEF5E7', fg: '9A7D0A' },
    Performance:{ bg: 'F4ECF7', fg: '6C3483' },
    Integration:{ bg: 'E8F8F5', fg: '117A65' },
  };

  const hdrFont   = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF' + COLORS.headerFg } };
  const cellFont  = { name: 'Calibri', size: 10 };
  const wrapAlign = { wrapText: true, vertical: 'top' as const };

  const borderThin = {
    top:    { style: 'thin' as const, color: { argb: 'FFBDBDBD' } },
    left:   { style: 'thin' as const, color: { argb: 'FFBDBDBD' } },
    bottom: { style: 'thin' as const, color: { argb: 'FFBDBDBD' } },
    right:  { style: 'thin' as const, color: { argb: 'FFBDBDBD' } },
  };

  // ── Sheet 1: All Test Cases ──────────────────────────────────────────────────
  const ws = wb.addWorksheet('Test Cases', { views: [{ state: 'frozen', ySplit: 2 }] });

  const columns = [
    { header: 'TC ID',            key: 'id',             width: 10 },
    { header: 'Module',           key: 'module',         width: 18 },
    { header: 'Test Case Name',   key: 'testName',       width: 32 },
    { header: 'Description',      key: 'description',    width: 42 },
    { header: 'Pre-Conditions',   key: 'preconditions',  width: 38 },
    { header: 'Test Steps',       key: 'steps',          width: 48 },
    { header: 'Expected Result',  key: 'expectedResult', width: 44 },
    { header: 'Priority',         key: 'priority',       width: 11 },
    { header: 'Type',             key: 'type',           width: 14 },
    { header: 'Status',           key: 'status',         width: 13 },
    { header: 'Tested By',        key: 'testedBy',       width: 16 },
    { header: 'Test Date',        key: 'testDate',       width: 14 },
    { header: 'Notes',            key: 'notes',          width: 28 },
  ];

  ws.columns = columns;

  // Title row
  ws.insertRow(1, ['SURAKSHA DISASTER MANAGEMENT SYSTEM — TEST CASES (v1.0)']);
  ws.mergeCells('A1:M1');
  const titleCell = ws.getCell('A1');
  titleCell.font  = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF' + COLORS.headerFg } };
  titleCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + COLORS.headerBg } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 28;

  // Header row (row 2)
  const hdrRow = ws.getRow(2);
  columns.forEach((col, i) => {
    const cell = hdrRow.getCell(i + 1);
    cell.value = col.header;
    cell.font  = hdrFont;
    cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + COLORS.headerBg } };
    cell.alignment = { ...wrapAlign, horizontal: 'center' };
    cell.border = borderThin;
  });
  hdrRow.height = 22;

  // Data rows
  TEST_CASES.forEach((tc, idx) => {
    const row = ws.addRow({
      id: tc.id, module: tc.module, testName: tc.testName,
      description: tc.description, preconditions: tc.preconditions,
      steps: tc.steps, expectedResult: tc.expectedResult,
      priority: tc.priority, type: tc.type, status: tc.status,
      testedBy: '', testDate: '', notes: '',
    });

    // Zebra background
    const rowBg = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF7FBFF';

    row.eachCell((cell, colNum) => {
      cell.font      = cellFont;
      cell.alignment = wrapAlign;
      cell.border    = borderThin;
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
    });

    // Priority cell colour
    const priCell = row.getCell('priority');
    const priColor = COLORS[tc.priority as keyof typeof COLORS] as { bg: string; fg: string };
    if (priColor) {
      priCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + priColor.bg } };
      priCell.font = { ...cellFont, bold: true, color: { argb: 'FF' + priColor.fg } };
      priCell.alignment = { ...wrapAlign, horizontal: 'center' };
    }

    // Type cell colour
    const typeCell = row.getCell('type');
    const typeColor = COLORS[tc.type as keyof typeof COLORS] as { bg: string; fg: string };
    if (typeColor) {
      typeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + typeColor.bg } };
      typeCell.font = { ...cellFont, bold: false, color: { argb: 'FF' + typeColor.fg } };
      typeCell.alignment = { ...wrapAlign, horizontal: 'center' };
    }

    // Status cell
    const statusCell = row.getCell('status');
    statusCell.font = { ...cellFont, italic: true, color: { argb: 'FF757575' } };
    statusCell.alignment = { ...wrapAlign, horizontal: 'center' };

    row.height = 72;
  });

  // Auto-filter on header row
  ws.autoFilter = { from: 'A2', to: 'M2' };

  // ── Sheet 2: Summary Dashboard ───────────────────────────────────────────────
  const sum = wb.addWorksheet('Summary');
  sum.getColumn(1).width = 28;
  sum.getColumn(2).width = 16;
  sum.getColumn(3).width = 16;

  const addSumTitle = (label: string, row: number) => {
    const cell = sum.getCell(row, 1);
    cell.value = label;
    cell.font  = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF' + COLORS.headerFg } };
    cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + COLORS.headerBg } };
    cell.border = borderThin;
    sum.mergeCells(row, 1, row, 3);
    sum.getRow(row).height = 22;
  };

  const addSumRow = (label: string, value: number | string, row: number, col2: number | string = '') => {
    [label, value, col2].forEach((v, i) => {
      const cell = sum.getCell(row, i + 1);
      cell.value = v;
      cell.font  = { name: 'Calibri', size: 11 };
      cell.border = borderThin;
      cell.alignment = { vertical: 'middle', horizontal: i === 0 ? 'left' : 'center' };
    });
    sum.getRow(row).height = 18;
  };

  // Overview
  addSumTitle('📋  OVERALL SUMMARY', 1);
  addSumRow('Total Test Cases',  TEST_CASES.length, 2);
  addSumRow('Not Tested',        TEST_CASES.filter(t => t.status === 'Not Tested').length, 3);
  addSumRow('Pass',              TEST_CASES.filter(t => t.status === 'Pass').length, 4);
  addSumRow('Fail',              TEST_CASES.filter(t => t.status === 'Fail').length, 5);

  // By Module
  addSumTitle('📦  BY MODULE', 7);
  const modules = [...new Set(TEST_CASES.map(t => t.module))];
  modules.forEach((mod, i) => {
    addSumRow(mod, TEST_CASES.filter(t => t.module === mod).length, 8 + i);
  });

  // By Priority
  const priRow = 8 + modules.length + 1;
  addSumTitle('🔴  BY PRIORITY', priRow);
  (['High', 'Medium', 'Low'] as const).forEach((p, i) => {
    addSumRow(p, TEST_CASES.filter(t => t.priority === p).length, priRow + 1 + i);
  });

  // By Type
  const typeRow = priRow + 5;
  addSumTitle('🧪  BY TEST TYPE', typeRow);
  const types = [...new Set(TEST_CASES.map(t => t.type))];
  types.forEach((tp, i) => {
    addSumRow(tp, TEST_CASES.filter(t => t.type === tp).length, typeRow + 1 + i);
  });

  // ── Sheet 3: Load Testing Guide ──────────────────────────────────────────────
  const lt = wb.addWorksheet('Load Testing Guide');
  lt.getColumn(1).width = 22;
  lt.getColumn(2).width = 55;
  lt.getColumn(3).width = 30;

  const ltData = [
    ['SURAKSHA — LOAD & PERFORMANCE TESTING GUIDE', '', ''],
    ['', '', ''],
    ['TOOL', 'k6 (https://k6.io) — free, JavaScript-based load testing tool', ''],
    ['INSTALL (Windows)', 'winget install k6 --source winget', ''],
    ['INSTALL (Mac)', 'brew install k6', ''],
    ['INSTALL (Linux)', 'sudo snap install k6', ''],
    ['', '', ''],
    ['TEST SCENARIO', 'COMMAND', 'TARGET METRIC'],
    ['Load Test (100 VUs)', 'k6 run tests/k6/load-test.js', 'p95 < 1500 ms, error < 1%'],
    ['Stress Test (200 VUs)', 'k6 run tests/k6/stress-test.js', 'p95 < 3000 ms, error < 5%'],
    ['Spike Test (300 VUs)', 'k6 run tests/k6/spike-test.js', 'Recovers after spike'],
    ['Soak Test (30 min)', 'k6 run tests/k6/soak-test.js', 'No memory leak, stable p95'],
    ['', '', ''],
    ['OUTPUT FORMAT', 'k6 run --out json=results.json load-test.js', 'Machine-readable results'],
    ['HTML REPORT', 'k6 run --out html=report.html load-test.js', 'Visual HTML dashboard'],
    ['', '', ''],
    ['KEY METRICS TO OBSERVE', '', ''],
    ['http_req_duration', 'Total request duration (p50, p95, p99)', 'p95 < your SLA target'],
    ['http_req_failed', 'Percentage of failed requests', '< 1% under normal load'],
    ['vus', 'Number of active virtual users at any time', 'Matches your ramp config'],
    ['iterations', 'Total test iterations completed', 'Increases throughout test'],
    ['', '', ''],
    ['BACKEND URL', 'http://localhost:3001', 'Change in k6 scripts if needed'],
    ['TEST USER EMAIL', 'testload@suraksha.lk', 'Seed this user before running'],
    ['TEST USER PASSWORD', 'LoadTest@2026', 'Must exist in the DB'],
  ];

  ltData.forEach((rowData, i) => {
    const row = lt.getRow(i + 1);
    rowData.forEach((val, j) => { row.getCell(j + 1).value = val; });
    if (i === 0) {
      lt.mergeCells(1, 1, 1, 3);
      row.getCell(1).font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
      row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + COLORS.headerBg } };
      row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      row.height = 28;
    } else if (['TEST SCENARIO', 'KEY METRICS TO OBSERVE'].includes(rowData[0])) {
      [1, 2, 3].forEach(c => {
        row.getCell(c).font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C3E50' } };
      });
    } else {
      [1, 2, 3].forEach(c => {
        row.getCell(c).font = { name: 'Calibri', size: 10 };
        row.getCell(c).border = borderThin;
        row.getCell(c).alignment = { wrapText: true, vertical: 'top' };
      });
    }
    row.height = row.height || 16;
  });

  // ── Save ─────────────────────────────────────────────────────────────────────
  const OUT = path.join(__dirname, '..', '..', 'tests', 'test-cases', 'Suraksha_Test_Cases.xlsx');
  await wb.xlsx.writeFile(OUT);
  console.log(`\n✅  Excel file written: ${OUT}\n`);
}

generateExcel().catch(console.error);
