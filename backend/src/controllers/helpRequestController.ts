import { Request, Response } from 'express';
import * as helpRequestService from '../services/helpRequestService';

/**
 * @swagger
 * tags:
 *   name: HelpRequests
 *   description: Help request management and verification
 */

/**
 * @swagger
 * /api/help-requests:
 *   post:
 *     summary: Create a new help request
 *     tags: [HelpRequests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - description
 *               - location
 *             properties:
 *               type: { type: string }
 *               description: { type: string }
 *               location: { type: string }
 *               latitude: { type: number }
 *               longitude: { type: number }
 *               peopleCount: { type: number }
 *               priority: { type: string, enum: [LOW, MEDIUM, HIGH, CRITICAL] }
 *     responses:
 *       201:
 *         description: Help request created successfully
 */
export const createHelpRequest = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const helpRequest = await helpRequestService.createHelpRequest(userId, req.body);

    const io = req.app.get('socketio');
    io.emit('new-help-request', helpRequest);

    res.status(201).json(helpRequest);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

/**
 * @swagger
 * /api/help-requests:
 *   get:
 *     summary: Get all help requests
 *     tags: [HelpRequests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of help requests
 */
export const getHelpRequests = async (req: Request, res: Response) => {
  try {
    const requests = await helpRequestService.getHelpRequests();
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

/**
 * @swagger
 * /api/help-requests/register-verifier:
 *   post:
 *     summary: Register as a local verifier
 *     tags: [HelpRequests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - verifierRole
 *               - jurisdiction
 *             properties:
 *               verifierRole: { type: string }
 *               jurisdiction: { type: string }
 *               orgName: { type: string }
 *     responses:
 *       201:
 *         description: Verifier registered successfully
 */
export const registerAsVerifier = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const verifier = await helpRequestService.registerVerifier(userId, req.body);
    res.status(201).json(verifier);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

/**
 * @swagger
 * /api/help-requests/verify:
 *   post:
 *     summary: Submit a verification action for an incident or help request
 *     tags: [HelpRequests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - result
 *             properties:
 *               incidentId: { type: string }
 *               helpRequestId: { type: string }
 *               result: { type: string, enum: [CONFIRMED, REJECTED, NEEDS_INVESTIGATION] }
 *               comment: { type: string }
 *     responses:
 *       201:
 *         description: Verification action recorded successfully
 */
export const verifyAction = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const action = await helpRequestService.createVerifierAction(userId, req.body);
    res.status(201).json(action);
  } catch (error: any) {
    res.status(error.message.includes('registered') ? 403 : 500).json({ message: error.message });
  }
};
