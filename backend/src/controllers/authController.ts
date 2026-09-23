import { Request, Response } from 'express';
import * as authService from '../services/authService';
import { googleLoginUser } from '../services/authService';

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and user management
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *               name: { type: string }
 *               phone: { type: string }
 *               region: { type: string }
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Registration failed
 */
// Roles a self-service (unauthenticated) caller may create.
const SELF_SIGNUP_ROLES = ['CITIZEN', 'VOLUNTEER', 'DMC_OFFICER'];
// Validation codes for the two gated self-signup roles (client used to check these).
const SIGNUP_CODES: Record<string, string> = {
  VOLUNTEER: process.env.SIGNUP_CODE_VOLUNTEER || 'VOL-2026-ACTIVE',
  DMC_OFFICER: process.env.SIGNUP_CODE_DMC || 'DMC-2026-SECURE',
};

export const register = async (req: any, res: Response) => {
  try {
    const requestedRole = (req.body?.role || 'CITIZEN').toUpperCase();
    const isAdminCaller = req.user?.role === 'ADMIN';

    if (requestedRole !== 'CITIZEN' && !isAdminCaller) {
      // Elevated roles (FIELD_RESPONDER, ADMIN, HOSPITAL_STAFF) are admin-only.
      if (!SELF_SIGNUP_ROLES.includes(requestedRole)) {
        return res.status(403).json({ message: 'This role can only be assigned by an administrator.' });
      }
      // VOLUNTEER / DMC_OFFICER self-signup requires the matching validation code.
      if (SIGNUP_CODES[requestedRole] && req.body?.validationCode !== SIGNUP_CODES[requestedRole]) {
        return res.status(403).json({ message: `Invalid validation code for the ${requestedRole} role.` });
      }
    }

    const user = await authService.registerUser({ ...req.body, role: requestedRole });
    res.status(201).json({ message: 'User registered successfully', userId: user.id });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Internal server error' });
  }
};

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login and get a JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: { type: string }
 *                 user: { type: object }
 *       401:
 *         description: Invalid credentials
 */
export const login = async (req: Request, res: Response) => {
  try {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const device = req.headers['user-agent'];
    const result = await authService.loginUser({ ...req.body, ipAddress, device });
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ message: error.message || 'Invalid credentials' });
  }
};

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200:
 *         description: Password updated successfully
 */
export const changePassword = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;
    await authService.updatePassword(userId, currentPassword, newPassword);
    res.json({ message: 'Password updated successfully' });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Internal server error' });
  }
};

export const savePushToken = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const { pushToken } = req.body;
    if (!pushToken) return res.status(400).json({ message: 'pushToken is required' });
    const prisma = (await import('../utils/prisma')).default;
    await prisma.user.update({ where: { id: userId }, data: { pushToken } });
    res.json({ message: 'Push token saved' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: 'idToken is required' });
    const ipAddress = req.ip || req.socket.remoteAddress;
    const device = req.headers['user-agent'];
    const result = await googleLoginUser(idToken, ipAddress, device);
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ message: error.message || 'Google Sign-In failed' });
  }
};

export const setup2FA = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const result = await authService.setup2FA(userId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Internal server error' });
  }
};

export const verify2FA = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const { token } = req.body;
    const result = await authService.verify2FA(userId, token);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Internal server error' });
  }
};

export const disable2FA = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: 'Password is required' });
    const result = await authService.disable2FA(userId, password);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Internal server error' });
  }
};
