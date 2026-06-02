import { Request, Response } from 'express';
import * as userService from '../services/userService';

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile and role management
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 */
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await userService.listUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

/**
 * @swagger
 * /api/users/{id}/role:
 *   patch:
 *     summary: Update user role (Admin only)
 *     tags: [Users]
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
 *               - role
 *             properties:
 *               role: { type: string, enum: [CITIZEN, VOLUNTEER, ADMIN, DMC_OFFICER] }
 *     responses:
 *       200:
 *         description: Role updated
 */
export const updateUserRole = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const user = await userService.updateUserRole(id, role);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete a user (Admin only)
 *     tags: [Users]
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
 *         description: User deleted
 */
export const deleteUser = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    await userService.deleteUser(id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

/**
 * @swagger
 * /api/users/profile:
 *   patch:
 *     summary: Update current user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               phone: { type: string }
 *               region: { type: string }
 *     responses:
 *       200:
 *         description: Profile updated
 */
export const updateProfile = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const user = await userService.updateProfile(userId, req.body);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user's information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 */
export const getMe = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const user = await userService.getUserById(userId);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getRBACMatrix = async (req: any, res: Response) => {
  try {
    const matrix = await userService.getRBACMatrix();
    res.json(matrix);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const updateRBACMatrix = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const permissions = req.body;
    await userService.updateRBACMatrix(permissions, userId);
    res.json({ message: 'Permissions updated' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const bulkImportUsers = async (req: any, res: Response) => {
  try {
    const users = req.body;
    const result = await userService.bulkImportUsers(users);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getAuditLogs = async (req: any, res: Response) => {
  try {
    const logs = await userService.getAuditLogs();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const toggleFieldResponderApp = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { hasApp } = req.body;
    await userService.toggleFieldResponderApp(id, hasApp);
    res.json({ message: 'Field app status updated' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const sendAppLink = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    await userService.sendAppLink(id);
    res.json({ message: 'App link sent' });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Internal server error' });
  }
};
