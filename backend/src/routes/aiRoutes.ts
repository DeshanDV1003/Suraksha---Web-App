import { Router, Request, Response } from 'express';
import { authMiddleware as authenticateToken } from '../middleware/auth';
import {
  analyzeReport,
  getClarificationQuestions,
  getHotspotForecast,
  optimizeResources,
  composeTeam,
  getSituationSummary,
  detectDrift,
  verifyIncidentCredibility,
  getActiveLearningQueue,
  getBiasAwareRiskForecast,
  coordinateRelief,
} from '../services/aiService';

const router = Router();

// ── Health check — ping the ML service ───────────────────────────────────────
router.get('/health', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const axios = await import('axios');
    const ML = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
    const r = await axios.default.get(`${ML}/health`, { timeout: 4000 });
    res.json({ online: true, ...r.data });
  } catch {
    res.json({ online: false });
  }
});

// ── F5 + F3 — Analyze a report (multitask + uncertainty) ─────────────────────
router.post('/analyze-report', authenticateToken, async (req: Request, res: Response) => {
  try {
    const result = await analyzeReport({
      text: req.body.text,
      latitude: req.body.latitude ?? null,
      longitude: req.body.longitude ?? null,
      detectedLanguage: req.body.detected_language || req.body.detectedLanguage || 'en',
      languageConfidence: req.body.language_confidence ?? 0.7,
      priorityConfidence: req.body.priority_confidence ?? 0.5,
    });
    if (!result) return res.status(503).json({ message: 'ML service unavailable' });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: 'AI analysis failed', error: err.message });
  }
});

// ── F4 — Clarification questions ─────────────────────────────────────────────
router.post('/clarification-questions', authenticateToken, async (req: Request, res: Response) => {
  try {
    const result = await getClarificationQuestions(req.body);
    if (!result) return res.status(503).json({ message: 'ML service unavailable' });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: 'AI clarification failed', error: err.message });
  }
});

// ── F7 + F8 — Hotspot forecast ───────────────────────────────────────────────
router.get('/hotspots', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const result = await getHotspotForecast();
    if (!result) return res.status(503).json({ message: 'ML service unavailable' });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: 'Hotspot forecast failed', error: err.message });
  }
});

// ── F10 — Resource optimization ──────────────────────────────────────────────
router.get('/optimize-resources', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const result = await optimizeResources();
    if (!result) return res.status(503).json({ message: 'ML service unavailable' });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: 'Resource optimization failed', error: err.message });
  }
});

// ── F12 — Team composition ───────────────────────────────────────────────────
router.post('/compose-team', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { disaster_type, latitude, longitude, team_size } = req.body;
    const result = await composeTeam({ disaster_type, latitude, longitude, team_size });
    if (!result) return res.status(503).json({ message: 'ML service unavailable' });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: 'Team composition failed', error: err.message });
  }
});

// ── F16 — Situation summary ──────────────────────────────────────────────────
router.get('/situation-summary', authenticateToken, async (req: Request, res: Response) => {
  try {
    const hours = parseInt(req.query.hours as string) || 2;
    const result = await getSituationSummary(hours);
    if (!result) {
      res.json({
        summary_text: "AI service is currently unavailable.",
        key_points: ["The backend ML service could not be reached."],
        severity_trend: "STABLE"
      });
      return;
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: 'Situation summary failed', error: err.message });
  }
});

// ── F15 — Drift detection ────────────────────────────────────────────────────
router.get('/drift-status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const result = await detectDrift(hours);
    if (!result) return res.status(503).json({ message: 'ML service unavailable' });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: 'Drift detection failed', error: err.message });
  }
});

// ── R3 — Evidence graph verification ─────────────────────────────────────────
router.get('/verify-incident/:reportId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const reportId = Array.isArray(req.params.reportId) ? req.params.reportId[0] : req.params.reportId;
    const result = await verifyIncidentCredibility(reportId);
    if (!result) return res.status(503).json({ message: 'ML service unavailable' });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: 'Verification failed', error: err.message });
  }
});

// ── R4 — Active learning annotation queue ────────────────────────────────────
router.get('/annotation-queue', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const result = await getActiveLearningQueue();
    if (!result) return res.status(503).json({ message: 'ML service unavailable' });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: 'Active learning query failed', error: err.message });
  }
});

// ── R5 — Bias-aware spatiotemporal risk forecast ──────────────────────────────
router.get('/bias-risk-forecast', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const result = await getBiasAwareRiskForecast();
    if (!result) return res.status(503).json({ message: 'ML service unavailable' });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: 'Bias forecast failed', error: err.message });
  }
});

// ── R6 — NSGA-II relief coordination ─────────────────────────────────────────
router.get('/relief-coordination', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const result = await coordinateRelief();
    if (!result) return res.status(503).json({ message: 'ML service unavailable' });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: 'Relief coordination failed', error: err.message });
  }
});

export default router;
