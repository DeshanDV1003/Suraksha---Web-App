import { Request, Response } from 'express';
import prisma from '../utils/prisma';

// ================================
// HELP REQUESTS
// ================================

export const createHelpRequest = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const { type, description, location, latitude, longitude, priority, peopleCount } = req.body;

    const helpRequest = await prisma.helpRequest.create({
      data: {
        userId,
        type,
        description,
        location,
        latitude,
        longitude,
        priority,
        peopleCount
      }
    });

    const io = req.app.get('socketio');
    io.emit('new-help-request', helpRequest);

    res.status(201).json(helpRequest);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getHelpRequests = async (req: Request, res: Response) => {
  try {
    const requests = await prisma.helpRequest.findMany({
      include: {
        user: { select: { name: true, phone: true } },
        verifierActions: {
          include: { verifier: { include: { user: { select: { name: true } } } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

// ================================
// LOCAL VERIFIER MANAGEMENT
// ================================

export const registerAsVerifier = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const { verifierRole, jurisdiction, orgName } = req.body;

    const verifier = await prisma.localVerifier.create({
      data: {
        userId,
        verifierRole,
        jurisdiction,
        orgName
      }
    });

    res.status(201).json(verifier);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const verifyAction = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const { incidentId, helpRequestId, result, comment } = req.body;

    const verifier = await prisma.localVerifier.findUnique({ where: { userId } });
    if (!verifier) return res.status(403).json({ message: 'Only registered verifiers can perform this action' });

    const action = await prisma.verifierAction.create({
      data: {
        verifierId: verifier.id,
        incidentId,
        helpRequestId,
        result,
        comment
      }
    });

    // Update verifier count
    await prisma.localVerifier.update({
      where: { id: verifier.id },
      data: { verificationsCount: { increment: 1 } }
    });

    res.status(201).json(action);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};
