import { Router } from 'express';
import {
  checkIn,
  checkOut,
  getTodayAttendance,
  getStaffAttendanceHistory,
  getActiveStaff,
} from '../controllers/attendanceController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.post('/checkin', protect, checkIn);
router.post('/checkout', protect, checkOut);
router.get('/today', protect, getTodayAttendance);
router.get('/active', protect, getActiveStaff);
router.get('/history/:staffId', protect, getStaffAttendanceHistory);

export default router;