import { Request, Response } from 'express';
import * as auditService from '../services/auditService';

/**
 * @swagger
 * tags:
 *   name: Audit
 *   description: System audit logs and activity tracking
 */

/**
 * @swagger
 * /api/audit:
 *   get:
 *     summary: List all system audit logs (Admin only)
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of audit logs
 */
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const logs = await auditService.listAuditLogs();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};
