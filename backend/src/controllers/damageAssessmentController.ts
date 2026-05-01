import { Request, Response } from 'express';
import * as damageAssessmentService from '../services/damageAssessmentService';

export const reportDamage = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const assessment = await damageAssessmentService.createDamageAssessment(userId, req.body);

    const io = req.app.get('socketio');
    if (io) io.emit('new-damage-report', assessment);

    res.status(201).json(assessment);
  } catch (error) {
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
