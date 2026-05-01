import { Request, Response } from 'express';
import * as supportService from '../services/supportService';

export const createSupportRequest = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const request = await supportService.createSupportRequest(userId, req.body);

    const io = req.app.get('socketio');
    io.emit('new-support-request', request);

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getSupportRequests = async (req: Request, res: Response) => {
  try {
    const requests = await supportService.getSupportRequests();
    
    const maskedRequests = requests.map((r: any) => {
      if (r.anonymous) {
        return { ...r, user: { name: 'Anonymous', phone: 'Hidden' } };
      }
      return r;
    });

    res.json(maskedRequests);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const updateSupportStatus = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const request = await supportService.updateSupportStatus(id, req.body);
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};
