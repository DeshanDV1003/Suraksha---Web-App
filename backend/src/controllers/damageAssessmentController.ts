import { Request, Response } from 'express';
import * as damageAssessmentService from '../services/damageAssessmentService';
import { scoreDamage } from '../services/mlService';
import prisma from '../utils/prisma';

export const reportDamage = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const assessment = await damageAssessmentService.createDamageAssessment(userId, req.body);

    // Shape the input for the ML scorer — only send relevant fields
    const scoringPayload = {
      structuralDamage: req.body.structuralDamage,
      category: req.body.category,
      affectedPersons: req.body.affectedPersons,
      estimatedLoss: req.body.estimatedLoss,
      description: req.body.description,
    };

    // Run ML damage scoring asynchronously
    scoreDamage(scoringPayload).then(async (mlResult) => {
      if (!mlResult) return;

      // Write ML score back to the assessment record
      await prisma.damageAssessment.update({
        where: { id: assessment.id },
        data: {
          aiEstimatedCost: typeof mlResult.score === 'number' ? mlResult.score : null,
          aiEstimatedDamage: mlResult.severity ?? null,
        }
      });

      // Log ML prediction
      await prisma.mLLog.create({
        data: {
          inputData: { assessmentId: assessment.id, ...scoringPayload } as any,
          prediction: mlResult.severity ?? 'UNKNOWN',
          confidence: typeof mlResult.score === 'number' ? mlResult.score : 0,
          modelVersion: '1.0.0-damage'
        }
      });

      const io = req.app.get('socketio');
      if (io && ['HIGH', 'CRITICAL'].includes(mlResult.severity)) {
        io.emit('high-severity-damage', {
          assessmentId: assessment.id,
          severity: mlResult.severity,
          score: mlResult.score
        });
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
