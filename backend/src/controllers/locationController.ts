import { Request, Response } from 'express';
import * as locationService from '../services/locationService';

/**
 * @swagger
 * tags:
 *   name: Location
 *   description: User location tracking and logs
 */

/**
 * @swagger
 * /api/location:
 *   post:
 *     summary: Log current user location
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude: { type: number }
 *               longitude: { type: number }
 *     responses:
 *       201:
 *         description: Location logged successfully
 */
export const logLocation = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const { latitude, longitude } = req.body;
    const log = await locationService.saveLocationLog(userId, latitude, longitude);
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

/**
 * @swagger
 * /api/location/user/{userId}:
 *   get:
 *     summary: Get last known location of a user
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Last known location
 */
export const getUserLastLocation = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const location = await locationService.getLatestUserLocation(userId as string);
    res.json(location);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};
