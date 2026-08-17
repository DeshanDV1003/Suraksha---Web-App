import { Router } from 'express';
import { authMiddleware, hospitalMiddleware } from '../middleware/auth';
import {
  getHospitalDashboard,
  getHospitalReferrals,
  updateReferral,
  getHospitalCapacity,
  updateHospitalCapacity,
  updateWard,
  createWard,
} from '../controllers/hospitalController';

const router = Router();

// All hospital routes require auth + hospital_staff role
router.use(authMiddleware, hospitalMiddleware);

router.get('/dashboard', getHospitalDashboard);
router.get('/referrals', getHospitalReferrals);
router.patch('/referrals/:id', updateReferral);
router.get('/capacity', getHospitalCapacity);
router.patch('/capacity', updateHospitalCapacity);
router.get('/wards', getHospitalCapacity);
router.post('/wards', createWard);
router.patch('/wards/:wardId', updateWard);

export default router;
