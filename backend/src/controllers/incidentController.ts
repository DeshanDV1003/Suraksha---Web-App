import { Request, Response } from 'express';
import * as incidentService from '../services/incidentService';
import { processReport } from '../services/mlService';
import prisma from '../utils/prisma';

/**
 * @swagger
 * tags:
 *   name: Incidents
 *   description: Incident report management
 */

/**
 * @swagger
 * /api/incidents:
 *   post:
 *     summary: Create a new incident report
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - location
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               location:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               category:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Incident created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IncidentReport'
 *       500:
 *         description: Server error
 */
export const createIncident = async (req: any, res: Response) => {
  try {
    const reporterId = req.user.userId;
    const incident = await incidentService.createIncident({ ...req.body, reporterId });

    // Run ML/NLP asynchronously — don't make the user wait
    processReport({ ...req.body, images: incident.images }).then(async (mlResult) => {
      // Update the report with ML results
      await prisma.incidentReport.update({
        where: { id: incident.id },
        data: {
          severity: mlResult.priority as any,
        }
      });

      // Log ML prediction
      await prisma.mLLog.create({
        data: {
          inputData: req.body as any,
          prediction: mlResult.priority,
          confidence: mlResult.priority_confidence,
          modelVersion: "1.0.0"
        }
      });

      // If HIGH or CRITICAL — emit WebSocket event to DMC dashboard
      const io = req.app.get('socketio');
      if (['HIGH', 'CRITICAL'].includes(mlResult.priority)) {
        io.emit('new-high-priority-incident', {
          incidentId: incident.id,
          priority: mlResult.priority,
          confidence: mlResult.priority_confidence,
          location: incident.location
        });
      }
      
      // Also emit regular update for the new incident with updated severity
      io.emit('incident-updated', { ...incident, severity: mlResult.priority });

    }).catch(err => console.error('Async ML processing failed:', err));

    // Emit initial socket event for real-time update
    const io = req.app.get('socketio');
    io.emit('new-incident', incident);

    res.status(201).json({
        ...incident,
        message: 'Report submitted. Priority classification in progress.'
    });
  } catch (error) {
    console.error('Create incident error:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
};

/**
 * @swagger
 * /api/incidents:
 *   get:
 *     summary: Get all incident reports
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of incident reports
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/IncidentReport'
 */
export const getIncidents = async (req: Request, res: Response) => {
  try {
    const incidents = await incidentService.getAllIncidents();
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

/**
 * @swagger
 * /api/incidents/my:
 *   get:
 *     summary: Get incidents reported by the current user
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's incident reports
 */
export const getUserIncidents = async (req: any, res: Response) => {
  try {
    const reporterId = req.user.userId;
    const incidents = await incidentService.getIncidentsByUser(reporterId);
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

/**
 * @swagger
 * /api/incidents/{id}/status:
 *   patch:
 *     summary: Update incident status
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, ASSIGNED, IN_PROGRESS, RESOLVED]
 *     responses:
 *       200:
 *         description: Status updated successfully
 */
export const updateIncidentStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    const incident = await incidentService.updateIncidentStatus(id, status);

    // Emit socket event for update
    const io = req.app.get('socketio');
    io.emit('incident-updated', incident);

    res.json(incident);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

/**
 * @swagger
 * /api/incidents/{id}:
 *   delete:
 *     summary: Delete an incident report
 *     tags: [Incidents]
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
 *         description: Incident deleted successfully
 */
export const deleteIncident = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    await incidentService.deleteIncident(id);
    res.json({ message: 'Incident deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

/**
 * @swagger
 * /api/incidents/{id}:
 *   get:
 *     summary: Get an incident report by ID
 *     tags: [Incidents]
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
 *         description: Incident report details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IncidentReport'
 */
export const getIncidentById = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const incident = await incidentService.getIncidentById(id);
    res.json(incident);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};
