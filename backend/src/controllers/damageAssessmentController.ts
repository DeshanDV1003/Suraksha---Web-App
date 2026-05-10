import { Request, Response } from 'express';
import * as damageAssessmentService from '../services/damageAssessmentService';
import { scoreDamage } from '../services/mlService';
import prisma from '../utils/prisma';

/**
 * @swagger
 * tags:
 *   name: DamageAssessments
 *   description: Damage assessment management
 */

/**
 * @swagger
 * /api/damage:
 *   post:
 *     summary: Submit a new damage assessment
 *     tags: [DamageAssessments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - location
 *               - category
 *             properties:
 *               incidentId:
 *                 type: string
 *               location:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               category:
 *                 type: string
 *                 enum: [RESIDENTIAL, AGRICULTURAL, INFRASTRUCTURE, COMMERCIAL, UTILITY, OTHER]
 *               structuralDamage:
 *                 type: string
 *                 enum: [NONE, MINOR, MODERATE, MAJOR, TOTAL_LOSS]
 *               cropDamage:
 *                 type: string
 *                 enum: [NONE, MINOR, MODERATE, MAJOR, TOTAL_LOSS]
 *               utilityDamage:
 *                 type: string
 *                 enum: [NONE, MINOR, MODERATE, MAJOR, TOTAL_LOSS]
 *               roadDamage:
 *                 type: string
 *                 enum: [NONE, MINOR, MODERATE, MAJOR, TOTAL_LOSS]
 *               affectedPersons:
 *                 type: number
 *               estimatedLoss:
 *                 type: number
 *               mediaUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Damage assessment submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DamageAssessment'
 */
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

/**
 * @swagger
 * /api/damage:
 *   get:
 *     summary: Get all damage assessments
 *     tags: [DamageAssessments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of damage assessments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DamageAssessment'
 */
export const getDamageAssessments = async (req: Request, res: Response) => {
  try {
    const assessments = await damageAssessmentService.getDamageAssessments();
    res.json(assessments);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

/**
 * @swagger
 * /api/damage/{id}:
 *   delete:
 *     summary: Delete a damage assessment record
 *     tags: [DamageAssessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Assessment record deleted
 */
export const deleteDamageAssessment = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    await damageAssessmentService.deleteDamageAssessment(id);
    res.json({ message: 'Assessment record deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};
