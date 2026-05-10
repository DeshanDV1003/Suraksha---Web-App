import { Request, Response } from 'express';
import * as analyticsService from '../services/analyticsService';

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Operational intelligence and advanced data analysis
 */

/**
 * @swagger
 * /api/analytics/operational:
 *   get:
 *     summary: Get advanced operational intelligence and trends
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Operational intelligence data
 */
export const getOperationalIntelligence = async (req: Request, res: Response) => {
  try {
    const stats = await analyticsService.getOperationalIntelligence();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};
