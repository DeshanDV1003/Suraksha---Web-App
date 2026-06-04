import { Router } from 'express';
import { createDonation, getDonations, updateDonationStatus } from '../controllers/donationController';
import { authMiddleware, officerMiddleware } from '../middleware/auth';

const router = Router();

// Public / Citizen endpoint (Can be used with or without auth depending on requirements, here we use auth)
router.post('/', authMiddleware, createDonation);

// Officer endpoints
router.get('/', authMiddleware, officerMiddleware, getDonations);
router.patch('/:id/status', authMiddleware, officerMiddleware, updateDonationStatus);

export default router;
