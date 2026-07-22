import { Request, Response } from 'express';
import * as incidentService from '../services/incidentService';
import { processReport } from '../services/mlService';
import prisma from '../utils/prisma';
import { geocodeAddress } from '../services/geocodingService';
import { findZoneForCoordinates } from '../services/zoneService';

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
    let { latitude, longitude, location, ...rest } = req.body;
    let zoneId: string | null = null;
    let zoneName: string | null = null;
    let province: string | null = null;

    // 1. If lat/lng are missing but location/address is provided, geocode it
    if ((latitude === undefined || longitude === undefined || latitude === null || longitude === null) && location) {
      try {
        console.log(`🔍 Auto-geocoding location: "${location}" for new incident...`);
        const geoResult = await geocodeAddress(location);
        console.log('🗺️ Geocoding result:', geoResult);
        if (geoResult.success && geoResult.latitude && geoResult.longitude) {
          latitude = geoResult.latitude;
          longitude = geoResult.longitude;
        }
      } catch (err: any) {
        console.warn('Auto-geocoding failed during creation:', err.message);
      }
    }

    // 2. If lat/lng exist (either provided or geocoded), perform zone lookup
    if (latitude !== undefined && longitude !== undefined && latitude !== null && longitude !== null) {
      try {
        const zoneDetails = findZoneForCoordinates(parseFloat(latitude), parseFloat(longitude));
        zoneId = zoneDetails.zoneId;
        zoneName = zoneDetails.zoneName;
        province = zoneDetails.province;
      } catch (err: any) {
        console.warn('Zone geofencing failed during creation:', err.message);
      }
    }

    const incident = await incidentService.createIncident({
      ...rest,
      location,
      latitude: latitude !== undefined ? parseFloat(latitude) : null,
      longitude: longitude !== undefined ? parseFloat(longitude) : null,
      zoneId,
      zoneName,
      province,
      reporterId
    });

    // Run ML/NLP asynchronously — don't make the user wait
    processReport({ ...req.body, images: incident.images }).then(async (mlResult) => {
      // Validate priority against the Severity enum before writing to DB
      const VALID_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      const severity = VALID_SEVERITIES.includes(mlResult.priority?.toUpperCase())
        ? mlResult.priority.toUpperCase()
        : 'MEDIUM';

      // Write all NLP results back to the incident record
      await prisma.incidentReport.update({
        where: { id: incident.id },
        data: {
          severity: severity as any,
          mlConfidence: mlResult.priority_confidence ?? 0,
          detectedLanguage: mlResult.detected_language ?? null,
          languageConfidence: mlResult.language_confidence ?? null,
          // Only store translation if the language is not English
          translatedText: mlResult.detected_language !== 'en'
            ? (mlResult.translated_text ?? null)
            : null,
          nlpEntities: mlResult.nlp_entities ?? null,
        }
      });

      // Log ML prediction linked to this incident
      await prisma.mLLog.create({
        data: {
          incidentId: incident.id,
          inputData: {
            description: req.body.description,
            location: req.body.location,
          } as any,
          prediction: severity,
          confidence: mlResult.priority_confidence ?? 0,
          modelVersion: '1.0.0'
        }
      });

      // Emit WebSocket events — guard io in case socket is not yet ready
      const io = req.app.get('socketio');
      if (!io) return;

      if (['HIGH', 'CRITICAL'].includes(severity)) {
        io.emit('new-high-priority-incident', {
          incidentId: incident.id,
          priority: severity,
          confidence: mlResult.priority_confidence ?? 0,
          location: incident.location,
          nlpEntities: mlResult.nlp_entities,
          detectedLanguage: mlResult.detected_language,
        });
      }

      io.emit('incident-updated', {
        ...incident,
        severity,
        mlConfidence: mlResult.priority_confidence ?? 0,
      });

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
