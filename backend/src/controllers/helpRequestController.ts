import { Request, Response } from 'express';
import * as helpRequestService from '../services/helpRequestService';
import { notifyAdmins, sendNotification } from '../services/notificationService';

export const submitPublicRequest = async (req: Request, res: Response) => {
  try {
    const request = await helpRequestService.submitPublicRequest(req.body);
    const io = req.app.get('socketio');
    if (io) io.emit('new-help-request', request);
    notifyAdmins(
      'New Public Help Request',
      `${req.body.name || 'Someone'} needs help at ${req.body.location || 'unknown location'}. Priority: ${request.priority || 'NORMAL'}.`
    ).catch(() => {});
    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const createHelpRequest = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const request = await helpRequestService.createHelpRequest(userId, req.body);
    const io = req.app.get('socketio');
    if (io) io.emit('new-help-request', request);
    res.status(201).json(request);
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

export const handleSMSWebhook = async (req: Request, res: Response) => {
  try {
    const responseMessage = await helpRequestService.handleSMSWebhook(req.body);
    const io = req.app.get('socketio');
    if (io) io.emit('new-help-request', { message: 'New SMS request arrived' });
    
    // Simulate Twilio TwiML response
    res.type('text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${responseMessage}</Message></Response>`);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const assignResponder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { volunteerId } = req.body;
    const request = await helpRequestService.assignResponder(id as string, volunteerId);

    const io = req.app.get('socketio');
    if (io) io.emit('help-request-updated', request);

    // Notify the assigned volunteer
    if (volunteerId) {
      sendNotification(
        volunteerId,
        'You Have Been Assigned a Help Request',
        `You have been assigned to assist at ${(request as any).location || 'a location'}. Please check the Help Requests page for details.`
      ).catch(() => {});
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const updateRequestStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const request = await helpRequestService.updateRequestStatus(id as string, status);
    
    const io = req.app.get('socketio');
    if (io) io.emit('help-request-updated', request);

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getClusteredRequests = async (req: Request, res: Response) => {
  try {
    const clusters = await helpRequestService.getClusteredRequests();
    res.json(clusters);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const checkEscalations = async (req: Request, res: Response) => {
  try {
    const result = await helpRequestService.checkEscalations();
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

// Legacy Verifier code
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
