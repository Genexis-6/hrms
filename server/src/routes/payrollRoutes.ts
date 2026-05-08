import { Router } from 'express';
import {
  getReconciliation,
  getVerifiedStaffCount,
  getSalaryStructure,
  getRecentGradeChanges,
} from '../controllers/payrollController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();

router.get('/reconciliation', protect, adminOnly, getReconciliation);
router.get('/staff-count', protect, getVerifiedStaffCount);
router.get('/salary-structure', protect, getSalaryStructure);
router.get('/grade-changes', protect, getRecentGradeChanges);

export default router;