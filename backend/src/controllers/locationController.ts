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

// Newly added geocoding services
import { geocodeAddress, reverseGeocode } from '../services/geocodingService';
import { findZoneForCoordinates } from '../services/zoneService';

export const geocodeAddressHandler = async (req: Request, res: Response): Promise<any> => {
  try {
    const { address } = req.body;
    if (!address) {
      return res.status(400).json({ error: 'Address query is required' });
    }

    const result = await geocodeAddress(address);
    if (!result.success || !result.latitude || !result.longitude) {
      return res.status(422).json({
        error: 'Could not locate this address in Sri Lanka',
        suggestion: 'Try adding more context, such as the district name (e.g. "Galle Road, Colombo")'
      });
    }

    const zone = findZoneForCoordinates(result.latitude, result.longitude);

    return res.json({
      latitude: result.latitude,
      longitude: result.longitude,
      displayName: result.displayName,
      confidence: result.confidence,
      zone
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error during geocoding', error });
  }
};

export const reverseGeocodeHandler = async (req: Request, res: Response): Promise<any> => {
  try {
    const { latitude, longitude } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Latitude and Longitude coordinates are required' });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    const address = await reverseGeocode(lat, lng);
    const zone = findZoneForCoordinates(lat, lng);

    return res.json({
      address,
      zone
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error during reverse geocoding', error });
  }
};

