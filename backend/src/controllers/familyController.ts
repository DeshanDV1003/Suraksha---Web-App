import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const updateMySafetyStatus = async (req: any, res: Response): Promise<any> => {
  try {
    const userId = req.user.userId;
    const { status, message, latitude, longitude } = req.body;

    const checkIn = await prisma.safetyCheckIn.create({
      data: {
        userId,
        status,
        message,
        latitude,
        longitude
      }
    });

    return res.status(201).json(checkIn);
  } catch (error) {
    return res.status(500).json({ message: 'Error updating safety status', error });
  }
};

export const updateFamilyMemberStatus = async (req: any, res: Response): Promise<any> => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { name, relation, status, notes, age, phone } = req.body;

    if (id) {
      await prisma.familyMember.updateMany({
        where: { id, primaryUserId: userId },
        data: { name, relation, status, notes, age: age ? parseInt(age) : undefined, phone }
      });
      return res.json({ message: 'Family member updated successfully' });
    } else {
      const newMember = await prisma.familyMember.create({
        data: {
          primaryUserId: userId,
          name,
          relation,
          status,
          notes,
          age: age ? parseInt(age) : undefined,
          phone,
        }
      });
      return res.status(201).json(newMember);
    }
  } catch (error) {
    return res.status(500).json({ message: 'Error updating family member', error });
  }
};

export const getMyFamilyStatus = async (req: any, res: Response): Promise<any> => {
  try {
    const userId = req.user.userId;

    const myLatestCheckIn = await prisma.safetyCheckIn.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    const familyMembers = await prisma.familyMember.findMany({
      where: { primaryUserId: userId }
    });

    return res.json({
      myStatus: myLatestCheckIn,
      familyMembers
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching family status', error });
  }
};

export const deleteFamilyMember = async (req: any, res: Response): Promise<any> => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    await prisma.familyMember.deleteMany({ where: { id, primaryUserId: userId } });
    return res.json({ message: 'Family member removed' });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting family member', error });
  }
};

export const adminOverrideFamilyMember = async (req: any, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    await prisma.familyMember.update({
      where: { id },
      data: { status, notes },
    });
    return res.json({ message: 'Family member status updated by admin' });
  } catch (error) {
    return res.status(500).json({ message: 'Error overriding family member status', error });
  }
};

export const getSafetyRoster = async (req: Request, res: Response): Promise<any> => {
  try {
    // For command room: Get latest check-ins of all users
    // This is a simplified approach. Ideally we use group by or distinct on user.
    const usersWithCheckIns = await prisma.user.findMany({
      include: {
        safetyCheckIns: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        familyMembers: true
      }
    });

    const roster = usersWithCheckIns.map(u => ({
      userId: u.id,
      name: u.name,
      phone: u.phone,
      latestCheckIn: u.safetyCheckIns[0] || null,
      familyMembers: u.familyMembers
    }));

    return res.json(roster);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching safety roster', error });
  }
};
