import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import Leave from '../models/Leave.js';
import Staff from '../models/Staff.js';
import { vetLeaveEligibility } from '../services/aiVettingEngine.js';

const { ObjectId } = mongoose.Types;

export const applyForLeave = async (req: Request, res: Response): Promise<void> => {
  try {
    const { staffId, leaveType, startDate, endDate } = req.body;

    // Calculate requested days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const requestedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Fetch staff for AI check
    const staff = await Staff.findById(staffId);
    if (!staff) {
      res.status(404).json({ message: 'Staff not found' });
      return;
    }

    // AI Leave Eligibility Check
    const aiResult = vetLeaveEligibility(staff, requestedDays, leaveType);

    // Create leave record with AI recommendation
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

    res.status(201).json({
      leave,
      aiVetting: aiResult,
    });
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

export const approveLeave = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    const leave = await Leave.findByIdAndUpdate(
      id,
      {
        status: comment?.toLowerCase().includes('reject') ? 'Rejected' : 'Approved',
        approvalComment: comment || 'Processed by admin',
      },
      {returnDocument: 'after' }
    ).populate('staffId', 'firstName lastName staffId leaveDaysRemaining');

    if (!leave) {
      res.status(404).json({ message: 'Leave application not found' });
      return;
    }

    // If approved, deduct leave days
    if (leave.status === 'Approved' && leave.staffId) {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const daysUsed = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      await Staff.findByIdAndUpdate(leave.staffId._id, {
        $inc: { leaveDaysRemaining: -daysUsed },
      });
    }

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