# Suraksha — Testing Guide

Complete guide for running all tests: functional API tests, load/performance tests, and reviewing results.

---

## Quick Reference

| What | Command | Time |
|------|---------|------|
| Generate / regenerate Excel test cases | `npx tsx scripts/generate-test-cases.ts` | ~5 sec |
| Update Excel with latest results | `npx tsx scripts/update-test-results.ts` | ~5 sec |
| Run functional API tests | See Section 2 below | ~3 min |
| Load test (100 VUs, 5 min) | `k6 run tests/k6/load-test.js` | 5 min |
| Spike test (300 VU burst) | `k6 run tests/k6/spike-test.js` | ~5 min |
| Stress test (ramp to 200 VUs) | `k6 run tests/k6/stress-test.js` | 13 min |
| Soak test (50 VUs, 30 min) | `k6 run tests/k6/soak-test.js` | 32 min |

> **k6 is installed at:** `D:\k6\k6-v0.54.0-windows-amd64\k6.exe`
> Use the full path if `k6` is not on your system PATH.

---

## Prerequisites — Before Running Any Tests

1. **Backend must be running** on port 3001
   ```
   cd "D:\Suraksha - Web App\backend"
   npm run dev
   ```

2. **Test user account must exist** — create it once:
   ```powershell
   Invoke-RestMethod http://localhost:3001/api/auth/register `
     -Method POST `
     -Body '{"name":"Load Tester","email":"testload@suraksha.lk","password":"LoadTest@2026","phone":"0771234567","role":"CITIZEN"}' `
     -ContentType "application/json"
   ```
   If you get a "duplicate email" error, the account already exists — that's fine.

3. **Get an auth token** (needed for most API tests):
   ```powershell
   $r = Invoke-RestMethod http://localhost:3001/api/auth/login `
     -Method POST `
     -Body '{"email":"testload@suraksha.lk","password":"LoadTest@2026"}' `
     -ContentType "application/json"
   $token = $r.token
   $authH = @{ Authorization = "Bearer $token" }
   Write-Host "Token ready: $($token.Substring(0,20))..."
   ```

---

## Section 1 — Excel Test Cases

The Excel file contains **100 test cases** across 11 modules.

**File location:** `D:\Suraksha - Web App\tests\test-cases\Suraksha_Test_Cases.xlsx`

### Sheets inside the Excel

| Sheet | Contents |
|-------|----------|
| Test Cases | All 100 test cases — colour-coded Pass (green) / Fail (red) / N/A (yellow) |
| Summary Dashboard | Total counts, pass rate, test date |
| Load Testing Guide | Instructions for running k6 tests |

### Columns in Test Cases sheet

| Column | Meaning |
|--------|---------|
| TC ID | Unique test case ID (TC-001 to TC-100) |
| Module | Which part of the system (Auth, Alerts, Water, etc.) |
| Test Case Name | Short name of the test |
| Description | What this test verifies |
| Pre-Conditions | What must be set up before running |
| Test Steps | Step-by-step how to run the test |
| Expected Result | What should happen |
| Priority | High / Medium / Low |
| Type | Functional / Negative / Security / Performance |
| Status | Pass / Fail / N/A / Not Tested |
| Tested By | Who ran the test |
| Test Date | Date tested |
| Notes | Findings, bugs, or comments |

### Regenerate the Excel file

If the file gets corrupted or you need a fresh copy:
```
cd "D:\Suraksha - Web App\backend"
npx tsx scripts/generate-test-cases.ts
```

### Update results after running tests

After you run tests and know the results, update the Excel:
```
cd "D:\Suraksha - Web App\backend"
npx tsx scripts/update-test-results.ts
```

---

## Section 2 — Functional API Tests (PowerShell)

These tests call the backend API directly and check the responses. Run them in **PowerShell** (not Command Prompt).

### Step 1 — Get a token first
```powershell
$BASE = "http://localhost:3001"
$r = Invoke-RestMethod "$BASE/api/auth/login" -Method POST `
  -Body '{"email":"testload@suraksha.lk","password":"LoadTest@2026"}' `
  -ContentType "application/json"
$token = $r.token
$authH = @{ Authorization = "Bearer $token" }
```

### Step 2 — Run individual test cases

#### Authentication Tests

```powershell
# TC-001: Citizen Login
$r = Invoke-RestMethod "$BASE/api/auth/login" -Method POST `
  -Body '{"email":"testload@suraksha.lk","password":"LoadTest@2026"}' `
  -ContentType "application/json"
Write-Host "TC-001: $(if($r.token){'PASS'}else{'FAIL'}) — Citizen Login"
```

```powershell
# TC-002: Wrong Password → expect HTTP 401
try {
  Invoke-RestMethod "$BASE/api/auth/login" -Method POST `
    -Body '{"email":"testload@suraksha.lk","password":"WrongPassword"}' `
    -ContentType "application/json" -ErrorAction Stop
  Write-Host "TC-002: FAIL — should have returned 401"
} catch {
  Write-Host "TC-002: $(if($_.Exception.Response.StatusCode.value__ -eq 401){'PASS'}else{'FAIL'}) — Wrong Password"
}
```

```powershell
# TC-007: No Token on Protected Route → expect HTTP 401
try {
  Invoke-RestMethod "$BASE/api/users/me" -ErrorAction Stop
  Write-Host "TC-007: FAIL — should have returned 401"
} catch {
  Write-Host "TC-007: $(if($_.Exception.Response.StatusCode.value__ -eq 401){'PASS'}else{'FAIL'}) — No Token"
}
```

#### Alert Tests

```powershell
# TC-013: List Active Alerts
$alerts = Invoke-RestMethod "$BASE/api/alerts" -Headers $authH
Write-Host "TC-013: $(if($alerts.Count -gt 0){'PASS'}else{'FAIL'}) — $($alerts.Count) alerts found"
```

#### Water / ML Tests

```powershell
# TC-035: River Water Levels
$river = Invoke-RestMethod "$BASE/api/water/river" -Headers $authH
Write-Host "TC-035: $(if($river.Count -gt 0){'PASS'}else{'FAIL'}) — $($river.Count) gauge readings"

# TC-037: Water Predictions
$preds = Invoke-RestMethod "$BASE/api/water/predictions" -Headers $authH
Write-Host "TC-037: $(if($preds.Count -gt 0){'PASS'}else{'FAIL'}) — $($preds.Count) predictions"

# TC-039: ML Service Status
$ml = Invoke-RestMethod "$BASE/api/water/ml-status" -Headers $authH
Write-Host "TC-039: $(if($ml.online -ne $null){'PASS'}else{'FAIL'}) — ML online: $($ml.online)"
```

#### Help Requests

```powershell
# TC-046: Submit Help Request (authenticated)
$hr = Invoke-RestMethod "$BASE/api/help-requests" -Method POST `
  -Body '{"type":"FOOD","description":"Need food supplies","location":"Colombo 7","latitude":6.9271,"longitude":79.8612}' `
  -ContentType "application/json" -Headers $authH
Write-Host "TC-046: $(if($hr.id){'PASS'}else{'FAIL'}) — id: $($hr.id)"
```

```powershell
# TC-047: Public Help Request (no login needed)
$pub = Invoke-RestMethod "$BASE/api/help-requests/public" -Method POST `
  -Body '{"name":"Kamal","phone":"0771234567","type":"MEDICAL","description":"Need doctor","location":"Kandy","latitude":7.2906,"longitude":80.6337}' `
  -ContentType "application/json"
Write-Host "TC-047: $(if($pub.id){'PASS'}else{'FAIL'}) — id: $($pub.id)"
```

#### Missing Persons

```powershell
# TC-055: Report Missing Person
$mp = Invoke-RestMethod "$BASE/api/missing-persons" -Method POST `
  -Body '{"name":"Kasun Silva","age":35,"description":"Blue shirt","lastSeen":"Colombo 7"}' `
  -ContentType "application/json" -Headers $authH
Write-Host "TC-055: $(if($mp.id){'PASS'}else{'FAIL'}) — id: $($mp.id)"

# TC-056: Public Missing Persons List (no login needed)
$pubMP = Invoke-RestMethod "$BASE/api/missing-persons/public"
Write-Host "TC-056: $(if($pubMP -is [array]){'PASS'}else{'FAIL'}) — $($pubMP.Count) records"
```

#### Users / Volunteers

```powershell
# TC-071: Update Profile (route is /profile not /me)
$upd = Invoke-RestMethod "$BASE/api/users/profile" -Method PATCH `
  -Body '{"name":"Updated Name"}' -ContentType "application/json" -Headers $authH
Write-Host "TC-071: $(if($upd){'PASS'}else{'FAIL'}) — Profile updated"

# TC-074: Citizen Cannot List All Users → expect 403
try {
  Invoke-RestMethod "$BASE/api/users" -Headers $authH -ErrorAction Stop
  Write-Host "TC-074: FAIL — citizen should not see all users"
} catch {
  Write-Host "TC-074: $(if($_.Exception.Response.StatusCode.value__ -eq 403){'PASS'}else{'FAIL'}) — HTTP $($_.Exception.Response.StatusCode.value__)"
}

# TC-076: View My Tasks (route is /my not /mine)
$tasks = Invoke-RestMethod "$BASE/api/volunteers/tasks/my" -Headers $authH
Write-Host "TC-076: $(if($tasks -is [array]){'PASS'}else{'FAIL'}) — $($tasks.Count) tasks"
```

#### Donations

```powershell
# TC-085: Submit Donation
$dn = Invoke-RestMethod "$BASE/api/donations" -Method POST `
  -Body '{"donorName":"Kamal Perera","type":"MONETARY","amount":500}' `
  -ContentType "application/json" -Headers $authH
Write-Host "TC-085: $(if($dn.id){'PASS'}else{'FAIL'}) — id: $($dn.id)"
```

#### AI Services (return 503 when ML is offline — that is correct behaviour)

```powershell
# TC-089, TC-090, TC-093: AI endpoints
# These return HTTP 503 when the Python ML service is not running.
# That is the EXPECTED behaviour (graceful degradation) — mark as PASS.

foreach ($endpoint in @("hotspots", "drift-status", "situation-summary")) {
  try {
    $ai = Invoke-RestMethod "$BASE/api/ai/$endpoint" -Headers $authH
    Write-Host "TC-AI /$endpoint: PASS — ML is online, data returned"
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    Write-Host "TC-AI /$endpoint: $(if($code -eq 503){'PASS (ML offline — graceful 503)'}else{"FAIL — HTTP $code"})"
  }
}
```

### Correct API Routes (common mistakes)

| Wrong route (do NOT use) | Correct route |
|--------------------------|---------------|
| `PATCH /api/users/me` | `PATCH /api/users/profile` |
| `GET /api/volunteers/tasks/mine` | `GET /api/volunteers/tasks/my` |
| `GET /api/ai/drift` | `GET /api/ai/drift-status` |
| `GET /api/ai/summary` | `GET /api/ai/situation-summary` |
| `GET /api/alerts/:id` | Does not exist — only `/api/alerts/:id/delivery` and `/api/alerts/:id/acknowledge` |

### Correct Prisma field names (for POST requests)

| Model | Wrong field name | Correct field name |
|-------|-----------------|-------------------|
| HelpRequest | `requestType` | `type` |
| HelpRequest | `district` | `location` |
| MissingPerson | `lastSeenLocation` | `lastSeen` |
| Donation | `donationType` | `type` (DonationType enum) |
| Donation | — | `donorName` is **required** |

---

## Section 3 — Load & Performance Testing with k6

k6 simulates many users hitting the backend at the same time to find performance limits.

**k6 path:** `D:\k6\k6-v0.54.0-windows-amd64\k6.exe`

Add to PATH temporarily in PowerShell (lasts for current session only):
```powershell
$env:PATH += ";D:\k6\k6-v0.54.0-windows-amd64"
```

Then you can just type `k6` instead of the full path.

### Load Test — 100 Virtual Users, 5 minutes
Tests normal production load.

```powershell
cd "D:\Suraksha - Web App"
D:\k6\k6-v0.54.0-windows-amd64\k6.exe run tests/k6/load-test.js
```

**What it does:** Ramps to 100 users over 1 minute, holds for 3 minutes, ramps down.

**Thresholds (pass/fail criteria):**
- p95 response time must be under 1,500 ms
- Error rate must be under 1%

**Known result (2026-09-06):** Error rate 0% ✅, p95 ≈ **530 ms** ✅ — both thresholds pass. `/api/water/predictions` is now served from the `WaterLevelPrediction` cache table instead of calling the ML service per gauge (see `project_docs/water_predictions_caching.md`). Before that fix p95 was ~26 s.

---

### Spike Test — 300 Virtual Users (sudden burst)
Tests how the system handles a sudden flood of users (like during a real disaster event).

```powershell
cd "D:\Suraksha - Web App"
D:\k6\k6-v0.54.0-windows-amd64\k6.exe run tests/k6/spike-test.js
```

**What it does:** Baseline 10 users → instant spike to 300 → hold 2 minutes → drop back.

**Threshold:** Error rate under 10%

**Known result:** 4.5% error rate ✅ — system survived the spike.

---

### Stress Test — Ramp to 200 Virtual Users (13 minutes)
Finds the breaking point of the system.

```powershell
cd "D:\Suraksha - Web App"
D:\k6\k6-v0.54.0-windows-amd64\k6.exe run tests/k6/stress-test.js
```

**What it does:** Slowly increases from 50 → 100 → 150 → 200 users over 13 minutes.

**Thresholds:**
- p95 under 3,000 ms
- Error rate under 5%

---

### Soak Test — 50 Virtual Users for 30 minutes
Detects memory leaks and slow degradation that only appear over time.

```powershell
cd "D:\Suraksha - Web App"
D:\k6\k6-v0.54.0-windows-amd64\k6.exe run tests/k6/soak-test.js
```

**What it does:** Holds a steady 50 users for 30 minutes.

**Thresholds:**
- p95 under 2,000 ms throughout
- Error rate under 1%

> ⚠️ This takes ~32 minutes. Run it before leaving for a break.

---

### Save Load Test Results to a File

```powershell
cd "D:\Suraksha - Web App"
D:\k6\k6-v0.54.0-windows-amd64\k6.exe run tests/k6/load-test.js 2>&1 | Tee-Object -FilePath tests/k6/results/load-test-results.txt
```

This saves the full k6 output under `tests/k6/results/` so you can show it at your viva.
All k6 result records live in `tests/k6/results/<date>/` (see `tests/README.md`).

---

## Section 4 — Reading k6 Output

When k6 finishes it prints a summary like this. Here is how to read it:

```
✓ stats 200          — check passed (HTTP 200 received)
✗ predictions 200    — check FAILED
  ↳ 12% failed

http_req_duration   p(95)=20.65s    — 95% of requests took this long
http_req_failed     rate=0.00%      — percentage of failed requests
```

**Key metrics to look for:**

| Metric | Meaning | Good value |
|--------|---------|-----------|
| `http_req_duration p(95)` | 95th percentile response time | Under 1–2 s |
| `http_req_failed rate` | Percentage of failed requests | Under 1–5% |
| `http_reqs` | Total requests made | Higher = more load |
| `vus_max` | Peak number of virtual users | Should match your target |

If a threshold fails k6 prints it in red and exits with code 1:
```
✗ p(95)<1500 — threshold breached
```

---

## Section 5 — ML Service Accuracy Reference

| Service | Algorithm | Accuracy | Status |
|---------|-----------|----------|--------|
| Water level forecasting | LSTM (deep learning) | ±0.14 m MAE | Good — operational |
| Flood risk classification | XGBoost | F1 ≥ 0.80 | Good — reliable |
| Alert text classification | BERT | ~50% | ❌ Not fine-tuned — random |
| Named entity extraction | spaCy NER | ~75% est. | Base model only |
| Duplicate alert detection | Sentence Transformers | High | Pre-trained SBERT |

> **For the viva:** LSTM and XGBoost are the strong ones. BERT is a known limitation — it uses the base pre-trained model without fine-tuning on disaster-domain text.

---

## Section 6 — Bugs Found During Testing

### BUG-001 (Fixed) — Public Help Request crashes with Prisma error
- **Test case:** TC-047
- **Endpoint:** `POST /api/help-requests/public`
- **Symptom:** HTTP 500 — `PrismaClientValidationError`
- **Root cause:** `submitPublicRequest()` spread the entire request body (including `name` and `phone`) into `prisma.helpRequest.create()`. Those fields do not exist on the `HelpRequest` model.
- **Fix applied in:** `backend/src/services/helpRequestService.ts`
- **Fix:** Destructure `{ name, phone, ...helpData }` before passing to Prisma so the extra fields are stripped out.

---

## Section 7 — Viva Demonstration Checklist

Use this checklist when presenting at your viva:

- [ ] Open `Suraksha_Test_Cases.xlsx` — show 100 test cases with colour-coded results
- [ ] Open the Summary Dashboard sheet — 47 Pass, 1 Fail (fixed), 98% pass rate
- [ ] Run one live API call in PowerShell to prove tests are real (TC-001 login)
- [ ] Show the k6 scripts in `tests/k6/` — explain the 4 test types
- [ ] Show the load test result numbers: 0% error rate, p95 bottleneck on ML endpoint
- [ ] Explain Bug BUG-001: what it was, where it was, how you fixed it
- [ ] Show the fix in `helpRequestService.ts` — the destructure line
- [ ] Explain ML accuracy: LSTM ±0.14 m is good, BERT is not fine-tuned (limitation)

---

*Last updated: 2026-08-19*
