import { Request, Response } from 'express';
import * as missingPersonService from '../services/missingPersonService';

export const reportMissingPerson = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId || null;
    const person = await missingPersonService.createMissingPerson(userId, req.body);

    const io = req.app.get('socketio');
    if (io) io.emit('new-missing-person', person);

    res.status(201).json(person);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getMissingPersons = async (req: Request, res: Response) => {
  try {
    const persons = await missingPersonService.getMissingPersons();
    res.json(persons);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

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

export const deleteMissingPerson = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    await missingPersonService.deleteMissingPerson(id);
    res.json({ message: 'Missing person record deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const searchFace = async (req: Request, res: Response) => {
  try {
    const { imageUrl } = req.body;
    const matches = await missingPersonService.searchFace(imageUrl);
    res.json(matches);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const triggerReunification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const person = await missingPersonService.triggerReunification(id, status, notes);
    res.json(person);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const runCrossReference = async (req: Request, res: Response) => {
  try {
    const matches = await missingPersonService.runCrossReference();
    res.json(matches);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};
