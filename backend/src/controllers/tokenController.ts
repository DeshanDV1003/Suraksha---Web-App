import { Request, Response } from 'express';
import * as tokenService from '../services/tokenService';

/**
 * @swagger
 * tags:
 *   name: Tokens
 *   description: Legacy token management (See ReliefTokens for newer system)
 */

/**
 * @swagger
 * /api/tokens:
 *   get:
 *     summary: List all tokens
 *     tags: [Tokens]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tokens
 */
export const getTokens = async (req: Request, res: Response) => {
  try {
    const tokens = await tokenService.listTokens();
    res.json(tokens);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @swagger
 * /api/tokens:
 *   post:
 *     summary: Create a new token for a user
 *     tags: [Tokens]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId: { type: string }
 *               type: { type: string }
 *     responses:
 *       201:
 *         description: Token created successfully
 */
export const createToken = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const token = await tokenService.createToken(userId);
    res.status(201).json(token);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * @swagger
 * /api/tokens/use:
 *   post:
 *     summary: Use a token by code
 *     tags: [Tokens]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code: { type: string }
 *     responses:
 *       200:
 *         description: Token used successfully
 */
export const useToken = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    const token = await tokenService.useToken(code);
    res.json(token);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
