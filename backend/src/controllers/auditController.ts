import { Request, Response } from 'express';
import * as auditService from '../services/auditService';

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const logs = await auditService.listAuditLogs();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};
