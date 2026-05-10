import { Request, Response } from 'express';
import * as dashboardService from '../services/dashboardService';

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: System-wide statistics and dashboard data
 */

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Get high-level system statistics for the dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalIncidents: { type: integer }
 *                 activeAlerts: { type: integer }
 *                 totalUsers: { type: integer }
 *                 reliefCamps: { type: integer }
 *                 missingPersons: { type: integer }
 */
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const stats = await dashboardService.getDashboardStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};
