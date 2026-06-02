import { Router } from 'express';
import { 
  createCamp, getCamps, getCampById, updateOccupancy,
  getResidents, addResident, checkoutResident,
  updateInventory, addSchedule, deleteSchedule,
  addReferral, updateReferral, createTransfer, updateTransfer
} from '../controllers/campController';
import { authMiddleware, officerMiddleware } from '../middleware/auth';

const router = Router();

// Core Camp
router.post('/', authMiddleware, officerMiddleware, createCamp);
router.get('/', getCamps);
router.get('/:id', getCampById);
router.patch('/:id/occupancy', authMiddleware, officerMiddleware, updateOccupancy);

// Residents
router.get('/:id/residents', getResidents);
router.post('/:id/residents', authMiddleware, addResident);
router.patch('/residents/:residentId/checkout', authMiddleware, checkoutResident);

// Inventory
router.patch('/:id/inventory', authMiddleware, officerMiddleware, updateInventory);

// Schedule
router.post('/:id/schedule', authMiddleware, officerMiddleware, addSchedule);
router.delete('/schedule/:scheduleId', authMiddleware, officerMiddleware, deleteSchedule);

// Referrals
router.post('/:id/referrals', authMiddleware, officerMiddleware, addReferral);
router.patch('/referrals/:referralId', authMiddleware, officerMiddleware, updateReferral);

// Transfers
router.post('/:id/transfers', authMiddleware, officerMiddleware, createTransfer);
router.patch('/transfers/:transferId', authMiddleware, officerMiddleware, updateTransfer);

export default router;
