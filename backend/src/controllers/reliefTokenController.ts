import { Request, Response } from 'express';
import * as reliefTokenService from '../services/reliefTokenService';

/**
 * @swagger
 * tags:
 *   name: ReliefTokens
 *   description: Relief token issuance and distribution management
 */

/**
 * @swagger
 * /api/relief-tokens/issue:
 *   post:
 *     summary: Issue a new relief token to a user
 *     tags: [ReliefTokens]
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
 *               campId: { type: string }
 *               maxUsage: { type: integer }
 *               expiresAt: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Token issued successfully
 */
export const issueReliefToken = async (req: any, res: Response) => {
  try {
    const token = await reliefTokenService.issueReliefToken(req.body);
    res.status(201).json(token);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

/**
 * @swagger
 * /api/relief-tokens/claim:
 *   post:
 *     summary: Claim relief items using a token (By citizen or verifier)
 *     tags: [ReliefTokens]
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
 *               - itemType
 *               - quantity
 *             properties:
 *               code: { type: string }
 *               itemType: { type: string }
 *               quantity: { type: integer }
 *               proofImage: { type: string }
 *               campId: { type: string }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Item claimed successfully
 */
export const claimReliefToken = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const claim = await reliefTokenService.claimReliefToken({ ...req.body, claimedBy: userId });
    res.status(201).json(claim);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * @swagger
 * /api/relief-tokens/record:
 *   post:
 *     summary: Record a relief distribution
 *     tags: [ReliefTokens]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tokenId
 *               - itemType
 *               - quantity
 *               - location
 *             properties:
 *               tokenId: { type: string }
 *               itemType: { type: string }
 *               quantity: { type: integer }
 *               location: { type: string }
 *               proofImage: { type: string }
 *     responses:
 *       201:
 *         description: Distribution recorded successfully
 */
export const recordDistribution = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const distribution = await reliefTokenService.recordDistribution(userId, req.body);
    res.status(201).json(distribution);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};
