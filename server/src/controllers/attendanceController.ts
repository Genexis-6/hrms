import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import Attendance from '../models/Attendance.js';

const { ObjectId } = mongoose.Types;

export const checkIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawStaffId = req.body.staffId as string;
    const staffId = new ObjectId(rawStaffId);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const existing = await Attendance.findOne({
      staffId,
      checkIn: { $gte: todayStart, $lte: todayEnd },
    });

    if (existing) {
      res.status(400).json({ message: 'Already checked in today' });
      return;
    }

    const attendance = await Attendance.create({
      staffId,
      checkIn: new Date(),
      status: 'Present',
    });

    res.status(201).json(attendance);
  } catch (error) {
    res.status(400).json({ message: 'Check-in failed', error: (error as Error).message });
  }
};

export const checkOut = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawStaffId = req.body.staffId as string;
    const staffId = new ObjectId(rawStaffId);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const attendance = await Attendance.findOneAndUpdate(
      {
        staffId,
        checkIn: { $gte: todayStart, $lte: todayEnd },
        checkOut: { $exists: false },
      },
      { checkOut: new Date() },
      { new: true }
    );

    if (!attendance) {
      res.status(404).json({ message: 'No active check-in record found for today' });
      return;
    }

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Check-out failed', error: (error as Error).message });
  }
};

export const getTodayAttendance = async (_req: Request, res: Response): Promise<void> => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const records = await Attendance.find({
      checkIn: { $gte: todayStart, $lte: todayEnd },
    }).populate('staffId', 'firstName lastName staffId department');

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const getStaffAttendanceHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawStaffId = req.params.staffId;

    // Guard: ensure staffId is a string, not string[] or undefined
    if (!rawStaffId || Array.isArray(rawStaffId)) {
      res.status(400).json({ message: 'Invalid staff ID' });
      return;
    }

    if (!ObjectId.isValid(rawStaffId)) {
      res.status(400).json({ message: 'Invalid staff ID format' });
      return;
    }

    const staffId = new ObjectId(rawStaffId);
    const { from, to } = req.query;

    const filter: Record<string, unknown> = { staffId };

    if (from && to && typeof from === 'string' && typeof to === 'string') {
      filter.checkIn = {
        $gte: new Date(from),
        $lte: new Date(to),
      };
    }

    const records = await Attendance.find(filter)
      .sort('-checkIn')
      .populate('staffId', 'firstName lastName staffId department');

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};