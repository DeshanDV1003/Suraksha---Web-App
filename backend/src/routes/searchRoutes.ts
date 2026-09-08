import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { globalSearch } from '../services/searchService';

const router = Router();

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: System-wide search across incidents, alerts, camps, people, resources and more
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Ranked search hits
 */
router.get('/', authMiddleware, async (req: any, res) => {
  try {
    const q = String(req.query.q || '');
    const results = await globalSearch(q, req.user?.role);
    res.json({ query: q, count: results.length, results });
  } catch (error) {
    console.error('[search] error:', error);
    res.status(500).json({ message: 'Search failed' });
  }
});

export default router;
