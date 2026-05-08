import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import Attendance from '../models/Attendance.js';

const { ObjectId } = mongoose.Types;

// Helper: Get start and end of today in local time (Nigeria WAT)
function getTodayRange() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { todayStart, todayEnd };
}

export const checkIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawStaffId = req.body.staffId as string;
    if (!rawStaffId || !ObjectId.isValid(rawStaffId)) {
      res.status(400).json({ message: 'Invalid staff ID' });
      return;
    }

    const staffId = new ObjectId(rawStaffId);
    const { todayStart, todayEnd } = getTodayRange();

    const existing = await Attendance.findOne({
      staffId,
      checkIn: { $gte: todayStart, $lte: todayEnd },
    });

    if (existing) {
      res.status(400).json({ message: 'Already checked in today' });
      return;
    }

    const now = new Date();
    const attendance = await Attendance.create({
      staffId,
      checkIn: now,
      status: now.getHours() >= 9 ? 'Late' : 'Present',
    });

    res.status(201).json(attendance);
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(400).json({ message: 'Check-in failed', error: (error as Error).message });
  }
};

export const checkOut = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawStaffId = req.body.staffId as string;
    console.log('Checkout requested for staffId:', rawStaffId);

    if (!rawStaffId || !ObjectId.isValid(rawStaffId)) {
      res.status(400).json({ message: `Invalid staff ID: ${rawStaffId}` });
      return;
    }

    const staffId = new ObjectId(rawStaffId);
    const { todayStart, todayEnd } = getTodayRange();

    // Check if already checked out — use $eq: null which matches both null and undefined
    const alreadyCheckedOut = await Attendance.findOne({
      staffId,
      checkIn: { $gte: todayStart, $lte: todayEnd },
      checkOut: { $ne: null },
    });

    if (alreadyCheckedOut) {
      res.status(400).json({ message: 'Already checked out today' });
      return;
    }

    // Find active check-in where checkOut is null or doesn't exist
    // Use $eq: null to catch both null and missing field
    const activeRecord = await Attendance.findOne({
      staffId,
      checkIn: { $gte: todayStart, $lte: todayEnd },
      checkOut: null,
    });

    console.log('Active record found:', activeRecord ? String(activeRecord._id) : 'NONE');

    if (!activeRecord) {
      const anyToday = await Attendance.findOne({
        staffId,
        checkIn: { $gte: todayStart, $lte: todayEnd },
      });

      if (!anyToday) {
        res.status(404).json({ message: 'No check-in record found for today. Please check in first.' });
      } else {
        res.status(400).json({ message: 'Already checked out today' });
      }
      return;
    }

    const attendance = await Attendance.findByIdAndUpdate(
      activeRecord._id,
      { checkOut: new Date() },
      { returnDocument: 'after' }
    ).populate('staffId', 'firstName lastName staffId department');

    if (!attendance) {
      res.status(500).json({ message: 'Failed to update record' });
      return;
    }

    console.log('Checkout successful:', String(attendance._id));
    res.json(attendance);
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ message: 'Check-out failed', error: (error as Error).message });
  }
};

export const getTodayAttendance = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { todayStart, todayEnd } = getTodayRange();

    const records = await Attendance.find({
      checkIn: { $gte: todayStart, $lte: todayEnd },
    })
      .populate('staffId', 'firstName lastName staffId department email')
      .sort('-checkIn');

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const getActiveStaff = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { todayStart, todayEnd } = getTodayRange();

    const active = await Attendance.find({
      checkIn: { $gte: todayStart, $lte: todayEnd },
      checkOut: null,
    }).populate('staffId', 'firstName lastName staffId department email');

    res.json(active);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const getStaffAttendanceHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawStaffId = req.params.staffId;

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