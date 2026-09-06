# Appendix E — Algorithm / Code Snippets

> Lecturer guideline 28: keep only *important algorithmic* snippets in the report;
> the full source stays in the repository. Right-align the heading ("Appendix E").
> Each snippet: 15–40 lines, with a 2–3 sentence lead-in.

---

## E.1 JWT authentication middleware — `backend/src/middleware/auth.ts`

Every protected route passes through `authMiddleware`; role-gated routes then pass
through `officerMiddleware` / `adminMiddleware`.

```ts
export const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);      // { userId, role, hospitalId? }
    next();
  } catch {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export const officerMiddleware = (req, res, next) =>
  (req.user && ['ADMIN', 'DMC_OFFICER'].includes(req.user.role))
    ? next()
    : res.status(403).json({ message: 'Access denied: requires admin or DMC officer role' });
```

---

## E.2 Severity feature vector + XGBoost training — `suraksha-ml/ml/train_classifier.py` (essential lines)

```python
FEATURES = ['affected_population','incident_type_code','has_children','has_elderly',
            'has_disabled','population_scale','hazard_modifier', ...]        # 12-dim

X, y = build_features(df), df['severity_label']
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
X_tr, y_tr = SMOTE(random_state=42).fit_resample(X_tr, y_tr)               # train only

clf = XGBClassifier(n_estimators=400, max_depth=6, learning_rate=0.1,
                    objective='multi:softprob', eval_metric='mlogloss')
clf.fit(X_tr, y_tr)

proba  = clf.predict_proba(X_te)
report = classification_report(y_te, proba.argmax(1), output_dict=True)     # macro-F1 0.81 / CV 0.834
joblib.dump(clf, 'models/priority_classifier.pkl')
```

---

## E.3 Uncertainty routing — `suraksha-ml/ml/uncertainty_triage.py` (core)

```python
def compute_uncertainty(p_raw, T, threshold):
    p    = softmax(np.log(p_raw + 1e-9) / T)        # temperature scaling (T from calibration set)
    pred = int(p.argmax())
    conf = float(p.max())
    route = 'auto' if conf >= threshold else 'human'
    return { 'severity': CLASSES[pred], 'confidence': conf, 'route': route,
             'conformal_set': [CLASSES[i] for i in np.where(p >= (1 - ALPHA))[0]] }
```

---

## E.4 LSTM forecast call + threshold classification — `suraksha-ml/ml/lstm_water_predictor.py`

```python
Xs = self.scaler.transform(self._prepare_features(readings))       # (12, 7)
y1, y2 = self.model.predict(Xs[np.newaxis, ...], verbose=0)[0]     # normalised T+1, T+2
t1, t2 = self._inverse_level(y1), self._inverse_level(y2)

peak = max(t1, t2)
if   peak >= thr['critical_m']: alert = 'CRITICAL'
elif peak >= thr['warning_m'] : alert = 'WARNING'
elif peak >= thr['watch_m']   : alert = 'WATCH'
else                          : alert = 'NONE'
return dict(predicted_t1_m=round(t1,3), predicted_t2_m=round(t2,3),
           confidence=conf, alert_level=alert, reason=self._explain(readings, t1, t2))
```

---

## E.5 Incident duplicate scoring — `backend/src/services/duplicateDetectionService.ts`

```ts
function haversineMetres(lat1,lon1,lat2,lon2){
  const R=6_371_000, φ1=lat1*Math.PI/180, φ2=lat2*Math.PI/180;
  const Δφ=(lat2-lat1)*Math.PI/180, Δλ=(lon2-lon1)*Math.PI/180;
  const a=Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
  return R*2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

let score = 0;
if (distanceM <= 1000)  score += 40 * (1 - distanceM/1000);   // LOCATION
score += 30;                                                   // CATEGORY (pre-filtered)
if (ageDiff <= SIX_H)   score += 20 * (1 - ageDiff/SIX_H);    // TIME
if (overlap > 0)        score += 10 * overlap;                 // NLP entity overlap
if (score >= 50) await prisma.incidentDuplicateLink.create({ data:{ reportId, canonicalId, score:Math.round(score), reasons }});
```

---

## E.6 Offline submit hook — `D:\Suraksha - Mobile App\src\hooks\useOfflineSubmit.ts` (decision core)

```ts
try {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, { method, signal, body: JSON.stringify(data), headers });
  if (res.ok) { setStatus('success'); return { success:true, data: await res.json() }; }
  if (res.status >= 400 && res.status < 500) {                 // permanent -> surface, don't queue
    setStatus('error'); throw new Error((await res.json()).message ?? `Request failed (${res.status})`);
  }
  throw new Error(`server_error_${res.status}`);               // 5xx -> fall through to queue
} catch (err) {
  const retryable = err.name==='AbortError' || err.message==='Network request failed'
                    || err.message?.startsWith('server_error_');
  if (!retryable) throw err;                                    // re-throw validation errors
}
const queueId = await addToSyncQueue(type, data);              // durable local queue
setStatus('queued'); return { success:true, queued:true, queueId };
```

---

## E.7 Prediction cache serve path — `backend/src/routes/waterRoutes.ts`

```ts
router.get('/predictions', async (_req, res) => {
  if (responseCache && Date.now() < responseCache.expires) return res.json(responseCache.body);
  if (!inFlight) inFlight = buildPredictionsPayload().finally(() => { inFlight = null; });
  res.json(await inFlight);                                     // concurrent misses share one build
});
// buildPredictionsPayload(): read WaterLevelPrediction rows; compute missing gauges inline (bounded);
// return stale rows now + refreshPredictions(stale) in background (single-flight); set 60 s cache.
```

---

## E.8 Geo-targeted alert relevance — `D:\Suraksha - Mobile App\src\utils\distance.ts`

```ts
export function isAlertNearby(alert, userLat, userLng) {
  if ((alert.locations ?? []).includes('All Island')) return true;
  const lats = alert.latitudes ?? [];
  if (lats.length === 0) return false;
  const radius = alert.broadcastRadiusKm ?? 10;
  for (let i = 0; i < lats.length; i++)
    if (haversineKm(userLat, userLng, lats[i], alert.longitudes[i]) <= radius) return true;
  return false;
}
```
