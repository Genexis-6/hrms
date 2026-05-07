import { Router } from 'express';
import {
  getDashboardStats,
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  searchStaff,
  bulkCreateStaff,
  getStaffStats,
} from '../controllers/staffController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();

// Dashboard
router.get('/dashboard', protect, getDashboardStats);

// Statistics & Search
router.get('/stats', protect, getStaffStats);
router.get('/search', protect, searchStaff);

// CRUD
router.get('/', protect, getAllStaff);
router.get('/:id', protect, getStaffById);
router.post('/', protect, adminOnly, createStaff);
router.put('/:id', protect, adminOnly, updateStaff);
router.delete('/:id', protect, adminOnly, deleteStaff);

// Bulk operations
router.post('/bulk', protect, adminOnly, bulkCreateStaff);

export default router;