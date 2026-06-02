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

export const generateAAR = async (req: Request, res: Response) => {
  try {
    const { incidentId } = req.params;
    const aar = await analyticsService.generateAAR(incidentId);
    res.json(aar);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getKPIBenchmarks = async (req: Request, res: Response) => {
  try {
    const { month } = req.query;
    const kpis = await analyticsService.getKPIBenchmarks(month as string);
    res.json(kpis);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getVulnerabilityIndex = async (req: Request, res: Response) => {
  try {
    const index = await analyticsService.getVulnerabilityIndex();
    res.json(index);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getDisasterBudgets = async (req: Request, res: Response) => {
  try {
    const budgets = await analyticsService.getDisasterBudgets();
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};
