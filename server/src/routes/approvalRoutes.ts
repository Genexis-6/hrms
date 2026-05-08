import { Router } from 'express';
import { approveStep, rejectStep, getPendingApprovals } from '../services/approvalEngine.js';
import { protect } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();

// Helper to extract a single string from req.params
const getParam = (param: string | string[] | undefined): string => {
  if (!param || Array.isArray(param)) return '';
  return param;
};

// Get pending approvals for current user's role
router.get('/pending', protect, async (req: AuthRequest, res) => {
  try {
    const userRole = req.user?.role || '';
    const pending = await getPendingApprovals(userRole);
    res.json(pending);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get pending approvals', error: (error as Error).message });
  }
});

// Approve a step
router.post('/:chainId/approve', protect, async (req: AuthRequest, res) => {
  try {
    const chainId = getParam(req.params.chainId);
    if (!chainId) {
      res.status(400).json({ message: 'Invalid chain ID' });
      return;
    }

    const { comment } = req.body;
    const userId = req.user?.id || '';
    const userRole = req.user?.role || '';

    const chain = await approveStep(chainId, userId, userRole, comment);
    res.json(chain);
  } catch (error) {
    res.status(400).json({ message: 'Approval failed', error: (error as Error).message });
  }
});

// Reject a step
router.post('/:chainId/reject', protect, async (req: AuthRequest, res) => {
  try {
    const chainId = getParam(req.params.chainId);
    if (!chainId) {
      res.status(400).json({ message: 'Invalid chain ID' });
      return;
    }

    const { comment } = req.body;
    const userId = req.user?.id || '';
    const userRole = req.user?.role || '';

    const chain = await rejectStep(chainId, userId, userRole, comment || 'Rejected');
    res.json(chain);
  } catch (error) {
    res.status(400).json({ message: 'Rejection failed', error: (error as Error).message });
  }
});

export default router;