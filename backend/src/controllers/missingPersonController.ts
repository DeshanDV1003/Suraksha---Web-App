import { Request, Response } from 'express';
import * as missingPersonService from '../services/missingPersonService';

/**
 * @swagger
 * tags:
 *   name: MissingPersons
 *   description: Missing person reporting and tracking
 */

/**
 * @swagger
 * /api/missing-persons:
 *   post:
 *     summary: Report a missing person
 *     tags: [MissingPersons]
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
 *               - description
 *               - lastSeen
 *             properties:
 *               name: { type: string }
 *               age: { type: integer }
 *               description: { type: string }
 *               lastSeen: { type: string }
 *               photo: { type: string }
 *     responses:
 *       201:
 *         description: Missing person reported successfully
 */
export const reportMissingPerson = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const person = await missingPersonService.createMissingPerson(userId, req.body);

    const io = req.app.get('socketio');
    if (io) io.emit('new-missing-person', person);

    res.status(201).json(person);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

/**
 * @swagger
 * /api/missing-persons:
 *   get:
 *     summary: Get all missing persons
 *     tags: [MissingPersons]
 *     responses:
 *       200:
 *         description: List of missing persons
 */
export const getMissingPersons = async (req: Request, res: Response) => {
  try {
    const persons = await missingPersonService.getMissingPersons();
    res.json(persons);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

/**
 * @swagger
 * /api/missing-persons/{id}/status:
 *   patch:
 *     summary: Update missing person status
 *     tags: [MissingPersons]
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
 *               - status
 *             properties:
 *               status: { type: string, enum: [MISSING, FOUND, DECEASED] }
 *     responses:
 *       200:
 *         description: Status updated
 */
export const updateMissingPersonStatus = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const person = await missingPersonService.updateMissingPersonStatus(id, status);
    res.json(person);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

/**
 * @swagger
 * /api/missing-persons/{id}:
 *   delete:
 *     summary: Delete a missing person record
 *     tags: [MissingPersons]
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
 *         description: Record deleted
 */
export const deleteMissingPerson = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    await missingPersonService.deleteMissingPerson(id);
    res.json({ message: 'Missing person record deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};
