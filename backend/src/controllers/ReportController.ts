import { Request, Response } from 'express';
import { ReportService } from '../services/ReportService';

const reportService = new ReportService();

export const exportReport = async (req: Request, res: Response) => {
  try {
    const { format = 'pdf', filters = {} } = req.body;
    
    // Assume user is attached to req by auth middleware
    const userRole = (req as any).user?.role || 'ADMIN'; 

    await reportService.generateReport(format, filters, userRole, res);
  } catch (error) {
    console.error('Error exporting report:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Failed to export report', details: (error as Error).message, stack: (error as Error).stack });
    }
  }
};
