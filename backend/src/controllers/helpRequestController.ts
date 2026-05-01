import { Request, Response } from 'express';
import * as helpRequestService from '../services/helpRequestService';

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

export const getHelpRequests = async (req: Request, res: Response) => {
  try {
    const requests = await helpRequestService.getHelpRequests();
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const registerAsVerifier = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const verifier = await helpRequestService.registerVerifier(userId, req.body);
    res.status(201).json(verifier);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const verifyAction = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const action = await helpRequestService.createVerifierAction(userId, req.body);
    res.status(201).json(action);
  } catch (error: any) {
    res.status(error.message.includes('registered') ? 403 : 500).json({ message: error.message });
  }
};
