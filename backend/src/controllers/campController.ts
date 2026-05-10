import { Request, Response } from 'express';
import * as campService from '../services/campService';

/**
 * @swagger
 * tags:
 *   name: ReliefCamps
 *   description: Relief camp management
 */

/**
 * @swagger
 * /api/camps:
 *   post:
 *     summary: Create a new relief camp
 *     tags: [ReliefCamps]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - location
 *               - totalCapacity
 *             properties:
 *               name: { type: string }
 *               location: { type: string }
 *               latitude: { type: number }
 *               longitude: { type: number }
 *               totalCapacity: { type: integer }
 *               services: { type: array, items: { type: string } }
 *     responses:
 *       201:
 *         description: Camp created successfully
 */
export const createCamp = async (req: Request, res: Response) => {
  try {
    const { name, location, latitude, longitude, totalCapacity, services } = req.body;
    const camp = await campService.createCamp({
      name,
      location,
      latitude: latitude ? parseFloat(latitude.toString()) : null,
      longitude: longitude ? parseFloat(longitude.toString()) : null,
      totalCapacity: parseInt(totalCapacity.toString()),
      services: services || [],
    });
    res.status(201).json(camp);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

/**
 * @swagger
 * /api/camps:
 *   get:
 *     summary: Get all relief camps
 *     tags: [ReliefCamps]
 *     responses:
 *       200:
 *         description: List of relief camps
 */
export const getCamps = async (req: Request, res: Response) => {
  try {
    const camps = await campService.getAllCamps();
    res.json(camps);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

/**
 * @swagger
 * /api/camps/{id}/occupancy:
 *   patch:
 *     summary: Update camp occupancy
 *     tags: [ReliefCamps]
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
 *             required:
 *               - currentOccupancy
 *             properties:
 *               currentOccupancy: { type: integer }
 *     responses:
 *       200:
 *         description: Occupancy updated
 */
export const updateOccupancy = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { currentOccupancy } = req.body;
    const camp = await campService.updateCampOccupancy(id, parseInt(currentOccupancy.toString()));
    res.json(camp);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};
