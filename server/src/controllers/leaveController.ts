import type { Request, Response } from 'express';
import Leave from '../models/Leave.js';

export const applyForLeave = async (req: Request, res: Response): Promise<void> => {
  try {
    const leave = await Leave.create(req.body);
    res.status(201).json(leave);
  } catch (error) {
    res.status(400).json({ message: 'Leave application failed', error: (error as Error).message });
  }
};

export const getAllLeaves = async (_req: Request, res: Response): Promise<void> => {
  try {
    const leaves = await Leave.find()
      .populate('staffId', 'firstName lastName staffId department')
      .sort('-appliedDate');
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const approveLeave = async (req: Request, res: Response): Promise<void> => {
  try {
    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      {
        status: 'Approved',
        approvalComment: req.body.comment || 'Approved by admin',
      },
      { new: true }
    );

    if (!leave) {
      res.status(404).json({ message: 'Leave application not found' });
      return;
    }
    res.json(leave);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};