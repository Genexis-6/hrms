import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import Attendance from '../models/Attendance.js';

const { ObjectId } = mongoose.Types;

export const checkIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawStaffId = req.body.staffId as string;
    if (!rawStaffId || !ObjectId.isValid(rawStaffId)) {
      res.status(400).json({ message: 'Invalid staff ID' });
      return;
    }

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
      status: new Date().getHours() >= 9 ? 'Late' : 'Present',
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

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    console.log('Looking for attendance record:', {
      staffId: staffId.toString(),
      todayStart: todayStart.toISOString(),
      todayEnd: todayEnd.toISOString(),
    });

    // First, find the record to debug
    const existingRecord = await Attendance.findOne({
      staffId,
      checkIn: { $gte: todayStart, $lte: todayEnd },
      checkOut: { $exists: false },
    });

    console.log('Found record:', existingRecord ? existingRecord._id : 'NONE');

    if (!existingRecord) {
      // Check if they already checked out
      const alreadyCheckedOut = await Attendance.findOne({
        staffId,
        checkIn: { $gte: todayStart, $lte: todayEnd },
        checkOut: { $exists: true },
      });

      if (alreadyCheckedOut) {
        res.status(400).json({ message: 'Already checked out today' });
        return;
      }

      // Check if they even checked in
      const anyRecordToday = await Attendance.findOne({
        staffId,
        checkIn: { $gte: todayStart, $lte: todayEnd },
      });

      if (!anyRecordToday) {
        res.status(404).json({ message: 'No check-in record found for today. Please check in first.' });
        return;
      }
    }

    // Now update
    const attendance = await Attendance.findOneAndUpdate(
      {
        staffId,
        checkIn: { $gte: todayStart, $lte: todayEnd },
        checkOut: { $exists: false },
      },
      { checkOut: new Date() },
      { returnDocument: 'after' }
    ).populate('staffId', 'firstName lastName staffId department');

    if (!attendance) {
      res.status(404).json({ message: 'Could not update record. No active check-in found.' });
      return;
    }

    console.log('Checkout successful:', attendance._id);
    res.json(attendance);
  } catch (error) {
    console.error('Check-out error:', error);
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
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const active = await Attendance.find({
      checkIn: { $gte: todayStart, $lte: todayEnd },
      checkOut: { $exists: false },
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