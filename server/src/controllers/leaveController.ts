import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import Leave from '../models/Leave.js';
import Staff from '../models/Staff.js';
import { vetLeaveEligibility } from '../services/aiVettingEngine.js';
import { createApprovalChain } from '../services/approvalEngine.js';
import { createAuditEntry } from '../middleware/audit.js';
import type { AuthRequest } from '../middleware/auth.js';

const { ObjectId } = mongoose.Types;

// Helper to extract safe string ID from params
const extractParamId = (param: string | string[] | undefined): string | null => {
  if (!param || Array.isArray(param)) return null;
  return param;
};

export const applyForLeave = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { staffId, leaveType, startDate, endDate } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const requestedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const staff = await Staff.findById(staffId);
    if (!staff) {
      res.status(404).json({ message: 'Staff not found' });
      return;
    }

    const aiResult = vetLeaveEligibility(staff, requestedDays, leaveType);

    const leave = await Leave.create({
      staffId,
      leaveType,
      startDate,
      endDate,
      status: aiResult.isEligible ? 'Pending' : 'Rejected',
      approvalComment: aiResult.isEligible
        ? `AI Recommendation: ${aiResult.recommendation} (Score: ${aiResult.score}%)`
        : `Auto-rejected by AI: ${aiResult.warnings.join('; ')}`,
    });

    const leaveId = String(leave._id);
    const userId = req.user?.id || 'system';

    // Create approval chain if eligible
    if (aiResult.isEligible) {
      await createApprovalChain('LEAVE', leaveId, 'Leave', staffId, userId);
    }

    // Audit log
    await createAuditEntry(
      'CREATE',
      'Leave',
      leaveId,
      userId,
      `Leave application: ${staff.firstName} ${staff.lastName} - ${leaveType} (${requestedDays} days)`,
      { after: { leaveType, startDate, endDate, aiResult } }
    );

    res.status(201).json({ leave, aiVetting: aiResult });
  } catch (error) {
    res.status(400).json({ message: 'Leave application failed', error: (error as Error).message });
  }
};

export const getAllLeaves = async (_req: Request, res: Response): Promise<void> => {
  try {
    const leaves = await Leave.find()
      .populate('staffId', 'firstName lastName staffId department leaveDaysRemaining')
      .sort('-appliedDate');
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const approveLeave = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = extractParamId(req.params.id);
    if (!id) {
      res.status(400).json({ message: 'Invalid leave ID' });
      return;
    }

    const { comment } = req.body;
    const isRejection = comment?.toLowerCase().includes('reject');
    const newStatus = isRejection ? 'Rejected' : 'Approved';
    const userId = req.user?.id || 'system';

    const leave = await Leave.findByIdAndUpdate(
      id,
      { status: newStatus, approvalComment: comment || 'Processed' },
      { returnDocument: 'after' }
    ).populate('staffId', 'firstName lastName staffId leaveDaysRemaining');

    if (!leave) {
      res.status(404).json({ message: 'Leave application not found' });
      return;
    }

    // Deduct leave days if approved
    if (newStatus === 'Approved' && leave.staffId) {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const daysUsed = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const staffDoc = leave.staffId as { _id: mongoose.Types.ObjectId };
      await Staff.findByIdAndUpdate(staffDoc._id, {
        $inc: { leaveDaysRemaining: -daysUsed },
      });
    }

    // Get staff name safely
    const staffInfo = leave.staffId as { firstName?: string; lastName?: string; leaveType?: string } | null;
    const staffName = staffInfo ? `${staffInfo.firstName || ''} ${staffInfo.lastName || ''}`.trim() : 'Unknown';

    await createAuditEntry(
      newStatus === 'Approved' ? 'APPROVE' : 'REJECT',
      'Leave',
      id,
      userId,
      `Leave ${newStatus.toLowerCase()}: ${staffName} - ${leave.leaveType}`,
      { before: { status: 'Pending' }, after: { status: newStatus, comment } }
    );

    res.json(leave);
  } catch (error) {
    res.status(500).json({ message: 'Approval failed', error: (error as Error).message });
  }
};

export const getLeaveStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = await Leave.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const result = { pending: 0, approved: 0, rejected: 0 };
    for (const s of stats) {
      if (s._id === 'Pending') result.pending = s.count;
      if (s._id === 'Approved') result.approved = s.count;
      if (s._id === 'Rejected') result.rejected = s.count;
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};