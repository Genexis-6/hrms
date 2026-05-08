import { Router } from 'express';
import AuditLog from '../models/AuditLog.js';
import { protect, adminOnly } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/audit — Get audit logs with filters
router.get('/', protect, adminOnly, async (req: AuthRequest, res) => {
  try {
    const { entity, action, page = '1', limit = '50' } = req.query;

    const filter: Record<string, unknown> = {};
    if (entity) filter.entity = entity;
    if (action) filter.action = action;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('changedBy', 'name email role')
        .sort('-timestamp')
        .skip(skip)
        .limit(limitNum),
      AuditLog.countDocuments(filter),
    ]);

    res.json({
      data: logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch audit logs', error: (error as Error).message });
  }
});

// GET /api/audit/recent — Recent activity for dashboard
router.get('/recent', protect, async (_req: AuthRequest, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('changedBy', 'name email')
      .sort('-timestamp')
      .limit(20);

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch recent activity', error: (error as Error).message });
  }
});

export default router;