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
});

// ── F4 — Clarification questions ─────────────────────────────────────────────
router.post('/clarification-questions', authenticateToken, async (req: Request, res: Response) => {
  const result = await getClarificationQuestions(req.body);
  if (!result) return res.status(503).json({ message: 'ML service unavailable' });
  res.json(result);
});

// ── F7 + F8 — Hotspot forecast ───────────────────────────────────────────────
router.get('/hotspots', authenticateToken, async (_req: Request, res: Response) => {
  const result = await getHotspotForecast();
  if (!result) return res.status(503).json({ message: 'ML service unavailable' });
  res.json(result);
});

// ── F10 — Resource optimization ──────────────────────────────────────────────
router.get('/optimize-resources', authenticateToken, async (_req: Request, res: Response) => {
  const result = await optimizeResources();
  if (!result) return res.status(503).json({ message: 'ML service unavailable' });
  res.json(result);
});

// ── F12 — Team composition ───────────────────────────────────────────────────
router.post('/compose-team', authenticateToken, async (req: Request, res: Response) => {
  const { disaster_type, latitude, longitude, team_size } = req.body;
  const result = await composeTeam({ disaster_type, latitude, longitude, team_size });
  if (!result) return res.status(503).json({ message: 'ML service unavailable' });
  res.json(result);
});

// ── F16 — Situation summary ──────────────────────────────────────────────────
router.get('/situation-summary', authenticateToken, async (req: Request, res: Response) => {
  const hours = parseInt(req.query.hours as string) || 2;
  const result = await getSituationSummary(hours);
  if (!result) return res.status(503).json({ message: 'ML service unavailable' });
  res.json(result);
});

// ── F15 — Drift detection ────────────────────────────────────────────────────
router.get('/drift-status', authenticateToken, async (req: Request, res: Response) => {
  const hours = parseInt(req.query.hours as string) || 24;
  const result = await detectDrift(hours);
  if (!result) return res.status(503).json({ message: 'ML service unavailable' });
  res.json(result);
});

export default router;
