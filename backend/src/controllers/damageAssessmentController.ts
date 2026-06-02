import { Request, Response } from 'express';
import * as damageAssessmentService from '../services/damageAssessmentService';
import { scoreDamage } from '../services/mlService';
import prisma from '../utils/prisma';

export const reportDamage = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const assessment = await damageAssessmentService.createDamageAssessment(userId, req.body);

    // Run ML damage scoring asynchronously
    scoreDamage(req.body).then(async (mlResult) => {
      if (mlResult) {
        // Log ML prediction
        await prisma.mLLog.create({
          data: {
            inputData: req.body as any,
            prediction: mlResult.severity,
            confidence: mlResult.score,
            modelVersion: "1.0.0-damage"
          }
        });

        // If high severity, we might want to alert or update linked incident
        const io = req.app.get('socketio');
        if (['HIGH', 'CRITICAL'].includes(mlResult.severity) && io) {
          io.emit('high-severity-damage', {
            assessmentId: assessment.id,
            severity: mlResult.severity,
            score: mlResult.score
          });
        }
      }
    }).catch(err => console.error('Async damage scoring failed:', err));

    const io = req.app.get('socketio');
    if (io) io.emit('new-damage-report', assessment);

    res.status(201).json(assessment);
  } catch (error) {
    console.error('Report damage error:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getDamageAssessments = async (req: Request, res: Response) => {
  try {
    const assessments = await damageAssessmentService.getDamageAssessments();
    res.json(assessments);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const deleteDamageAssessment = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    await damageAssessmentService.deleteDamageAssessment(id);
    res.json({ message: 'Assessment record deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

// New endpoints for Advanced Damage Assessment

export const aiClassifyImage = async (req: Request, res: Response) => {
  try {
    const { imageUrl } = req.body;
    const result = await damageAssessmentService.aiClassifyImage(imageUrl);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const updateWorkflowStatus = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reviewerNotes } = req.body;
    const userId = req.user.userId;
    
    const assessment = await damageAssessmentService.updateWorkflowStatus(id, status, reviewerNotes, userId);
    
    const io = req.app.get('socketio');
    if (io) io.emit('damage-assessment-updated', assessment);
    
    res.json(assessment);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getDistrictSummaryReport = async (req: Request, res: Response) => {
  try {
    const report = await damageAssessmentService.getDistrictSummaryReport();
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};
