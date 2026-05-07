import { Router } from 'express';
import { applyForLeave, getAllLeaves, approveLeave } from '../controllers/leaveController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();

router.post('/', protect, applyForLeave);
router.get('/', protect, getAllLeaves);
router.put('/:id/approve', protect, adminOnly, approveLeave);

export default router;