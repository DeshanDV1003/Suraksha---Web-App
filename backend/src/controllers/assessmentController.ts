import { Request, Response } from 'express';
import prisma from '../utils/prisma';

// ================================
// DAMAGE ASSESSMENT
// ================================

export const reportDamage = async (req: any, res: Response) => {
  try {
    const reportedById = req.user.userId;
    const { 
      incidentId, location, latitude, longitude, category, 
      structuralDamage, cropDamage, utilityDamage, roadDamage,
      affectedPersons, estimatedLoss, mediaUrls, notes 
    } = req.body;

    const assessment = await prisma.damageAssessment.create({
      data: {
        reportedById,
        incidentId,
        location,
        latitude,
        longitude,
        category,
        structuralDamage,
        cropDamage,
        utilityDamage,
        roadDamage,
        affectedPersons,
        estimatedLoss,
        mediaUrls: mediaUrls || [],
        notes
      }
    });

    const io = req.app.get('socketio');
    io.emit('new-damage-report', assessment);

    res.status(201).json(assessment);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getDamageAssessments = async (req: Request, res: Response) => {
  try {
    const assessments = await prisma.damageAssessment.findMany({
      include: {
        reportedBy: { select: { name: true } },
        incident: { select: { title: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(assessments);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

// ================================
// MISSING PERSONS
// ================================

export const reportMissingPerson = async (req: any, res: Response) => {
  try {
    const reportedBy = req.user.userId;
    const { name, age, description, lastSeen, photo } = req.body;

    const missingPerson = await prisma.missingPerson.create({
      data: {
        name,
        age,
        description,
        lastSeen,
        photo,
        reportedBy
      }
    });

    const io = req.app.get('socketio');
    io.emit('new-missing-person', missingPerson);

    res.status(201).json(missingPerson);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getMissingPersons = async (req: Request, res: Response) => {
  try {
    const persons = await prisma.missingPerson.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(persons);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const updateMissingPersonStatus = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const person = await prisma.missingPerson.update({
      where: { id },
      data: { status }
    });

    res.json(person);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};
