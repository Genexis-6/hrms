import { Router } from 'express';
import { checkIn, checkOut, getTodayAttendance } from '../controllers/attendanceController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.post('/checkin', protect, checkIn);
router.post('/checkout', protect, checkOut);
router.get('/today', protect, getTodayAttendance);

export default router;