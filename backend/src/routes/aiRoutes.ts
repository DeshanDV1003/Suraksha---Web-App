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

// ── F5 + F3 — Analyze a report (multitask + uncertainty) ─────────────────────
router.post('/analyze-report', authenticateToken, async (req: Request, res: Response) => {
  const result = await analyzeReport(req.body);
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
