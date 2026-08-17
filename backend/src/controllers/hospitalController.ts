import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import bcrypt from 'bcryptjs';

// GET /hospitals — list all active hospitals (used by camp officers for referral dropdown)
export const getHospitals = async (req: Request, res: Response) => {
  try {
    const hospitals = await prisma.hospital.findMany({
      where: { isActive: true },
      select: { id: true, name: true, location: true, phone: true, availableBeds: true, specialties: true },
      orderBy: { name: 'asc' },
    });
    res.json(hospitals);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch hospitals' });
  }
};

// POST /hospitals — admin creates a hospital
export const createHospital = async (req: Request, res: Response) => {
  try {
    const { name, location, latitude, longitude, phone, email, specialties, totalBeds } = req.body;
    const hospital = await prisma.hospital.create({
      data: { name, location, latitude, longitude, phone, email, specialties: specialties ?? [], totalBeds: totalBeds ?? 0, availableBeds: totalBeds ?? 0 },
    });
    res.status(201).json(hospital);
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Failed to create hospital' });
  }
};

// GET /hospital/dashboard — summary stats for the logged-in hospital
export const getHospitalDashboard = async (req: any, res: Response) => {
  try {
    const { hospitalId } = req.user;
    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
      include: { wards: true },
    });
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });

    const referralCounts = await prisma.hospitalReferral.groupBy({
      by: ['status'],
      where: { hospitalId },
      _count: { id: true },
    });

    const counts: Record<string, number> = {};
    referralCounts.forEach((r) => { counts[r.status] = r._count.id; });

    res.json({
      hospital,
      referrals: {
        PENDING: counts['PENDING'] ?? 0,
        ADMITTED: counts['ADMITTED'] ?? 0,
        DISCHARGED: counts['DISCHARGED'] ?? 0,
        TRANSFERRED: counts['TRANSFERRED'] ?? 0,
        DECEASED: counts['DECEASED'] ?? 0,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch dashboard' });
  }
};

// GET /hospital/referrals — referrals for this hospital
export const getHospitalReferrals = async (req: any, res: Response) => {
  try {
    const { hospitalId } = req.user;
    const { status, page = '1', limit = '20' } = req.query as any;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = { hospitalId };
    if (status) where.status = status;

    const [referrals, total] = await Promise.all([
      prisma.hospitalReferral.findMany({
        where,
        include: { camp: { select: { name: true, location: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.hospitalReferral.count({ where }),
    ]);

    res.json({ referrals, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch referrals' });
  }
};

// PATCH /hospital/referrals/:id — update referral status / notes
export const updateReferral = async (req: any, res: Response) => {
  try {
    const { hospitalId } = req.user;
    const { id } = req.params;
    const { status, hospitalNotes, outcome, admittedAt, dischargedAt } = req.body;

    const referral = await prisma.hospitalReferral.findFirst({ where: { id, hospitalId } });
    if (!referral) return res.status(404).json({ message: 'Referral not found' });

    const updated = await prisma.hospitalReferral.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(hospitalNotes !== undefined && { hospitalNotes }),
        ...(outcome !== undefined && { outcome }),
        ...(admittedAt && { admittedAt: new Date(admittedAt) }),
        ...(dischargedAt && { dischargedAt: new Date(dischargedAt) }),
      },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update referral' });
  }
};

// GET /hospital/capacity — wards and bed counts
export const getHospitalCapacity = async (req: any, res: Response) => {
  try {
    const { hospitalId } = req.user;
    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
      select: { totalBeds: true, availableBeds: true, wards: true },
    });
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
    res.json(hospital);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch capacity' });
  }
};

// PATCH /hospital/capacity — update hospital-level bed counts
export const updateHospitalCapacity = async (req: any, res: Response) => {
  try {
    const { hospitalId } = req.user;
    const { availableBeds, totalBeds } = req.body;
    const hospital = await prisma.hospital.update({
      where: { id: hospitalId },
      data: {
        ...(availableBeds !== undefined && { availableBeds }),
        ...(totalBeds !== undefined && { totalBeds }),
      },
    });
    res.json(hospital);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update capacity' });
  }
};

// PATCH /hospital/wards/:wardId — update a ward's bed count
export const updateWard = async (req: any, res: Response) => {
  try {
    const { hospitalId } = req.user;
    const { wardId } = req.params;
    const { availableBeds, totalBeds } = req.body;

    const ward = await prisma.hospitalWard.findFirst({ where: { id: wardId, hospitalId } });
    if (!ward) return res.status(404).json({ message: 'Ward not found' });

    const updated = await prisma.hospitalWard.update({
      where: { id: wardId },
      data: {
        ...(availableBeds !== undefined && { availableBeds }),
        ...(totalBeds !== undefined && { totalBeds }),
      },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update ward' });
  }
};

// POST /hospital/wards — add a ward
export const createWard = async (req: any, res: Response) => {
  try {
    const { hospitalId } = req.user;
    const { name, totalBeds } = req.body;
    const ward = await prisma.hospitalWard.create({
      data: { hospitalId, name, totalBeds: totalBeds ?? 0, availableBeds: totalBeds ?? 0 },
    });
    res.status(201).json(ward);
  } catch (err) {
    res.status(400).json({ message: 'Failed to create ward' });
  }
};

// GET /hospitals/:id/staff — list staff accounts for a hospital (admin)
export const getHospitalStaff = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const staff = await prisma.user.findMany({
      where: { hospitalId: id, role: 'HOSPITAL_STAFF' },
      select: { id: true, name: true, email: true, phone: true, createdAt: true },
      orderBy: { name: 'asc' },
    });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch staff' });
  }
};

// POST /hospitals/:id/staff — admin creates a hospital staff login
export const createHospitalStaff = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const hospital = await prisma.hospital.findUnique({ where: { id } });
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });

    const existing = await prisma.user.findFirst({ where: { email: email.toLowerCase().trim() } });
    if (existing) return res.status(409).json({ message: 'A user with this email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: 'HOSPITAL_STAFF',
        hospitalId: id,
        phone: phone || null,
      },
      select: { id: true, name: true, email: true, phone: true, createdAt: true },
    });

    res.status(201).json(user);
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Failed to create staff account' });
  }
};

// DELETE /hospitals/:hospitalId/staff/:userId — admin removes a staff account
export const deleteHospitalStaff = async (req: Request, res: Response) => {
  try {
    const hospitalId = req.params.hospitalId as string;
    const userId = req.params.userId as string;
    const user = await prisma.user.findFirst({ where: { id: userId, hospitalId, role: 'HOSPITAL_STAFF' } });
    if (!user) return res.status(404).json({ message: 'Staff member not found' });
    await prisma.user.delete({ where: { id: userId } });
    res.json({ message: 'Staff account removed' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete staff account' });
  }
};
