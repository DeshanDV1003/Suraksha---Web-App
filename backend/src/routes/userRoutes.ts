import { Router } from 'express';
import { getUsers, updateUserRole, deleteUser, updateProfile, getMe, getRBACMatrix, updateRBACMatrix, bulkImportUsers, getAuditLogs, toggleFieldResponderApp, sendAppLink } from '../controllers/userController';
import { authMiddleware, adminMiddleware, officerMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, officerMiddleware, getUsers);
router.get('/me', authMiddleware, getMe);
router.patch('/profile', authMiddleware, updateProfile);
router.patch('/:id/role', authMiddleware, adminMiddleware, updateUserRole);
router.delete('/:id', authMiddleware, adminMiddleware, deleteUser);

// RBAC
router.get('/rbac', authMiddleware, adminMiddleware, getRBACMatrix);
router.post('/rbac', authMiddleware, adminMiddleware, updateRBACMatrix);

// Bulk Import
router.post('/bulk-import', authMiddleware, adminMiddleware, bulkImportUsers);

// Audit
router.get('/audit', authMiddleware, adminMiddleware, getAuditLogs);

// Field Responder
router.post('/:id/field-status', authMiddleware, officerMiddleware, toggleFieldResponderApp);
router.post('/:id/send-app-link', authMiddleware, officerMiddleware, sendAppLink);

export default router;
