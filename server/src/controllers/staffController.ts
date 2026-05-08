import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import Staff from '../models/Staff.js';
import Attendance from '../models/Attendance.js';
import Leave from '../models/Leave.js';
import Promotion from '../models/Promotion.js';
import { detectGhostWorkers } from '../services/aiVettingEngine.js';

const { ObjectId } = mongoose.Types;

// ─── Helpers ────────────────────────────────────────────────────

/**
 * Extracts and validates a single ObjectId string from req.params.
 * Returns null if the param is missing, is an array, or is not a valid ObjectId.
 */
const extractParamId = (param: string | string[] | undefined): string | null => {
  if (!param || Array.isArray(param)) return null;
  if (!ObjectId.isValid(param)) return null;
  return param;
};

// ─── Dashboard Stats ───────────────────────────────────────────

export const getDashboardStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [totalStaff, presentToday, pendingLeave, pendingPromotions] = await Promise.all([
      Staff.countDocuments({ isActive: true }),
      Attendance.countDocuments({
        checkIn: { $gte: todayStart, $lte: todayEnd },
      }),
      Leave.countDocuments({ status: 'Pending' }),
      Promotion.countDocuments({ status: 'Pending' }),
    ]);

    const ghostCheck = detectGhostWorkers(totalStaff, totalStaff);

    res.json({
      totalStaff,
      presentToday,
      pendingLeave,
      pendingPromotions,
      ghostWorkerAlert: ghostCheck.discrepancy ? ghostCheck.message : '',
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to load dashboard stats',
      error: (error as Error).message,
    });
  }
};

// ─── Staff CRUD ─────────────────────────────────────────────────

export const getAllStaff = async (_req: Request, res: Response): Promise<void> => {
  try {
    const staff = await Staff.find()
      .select('-__v')
      .sort({ createdAt: -1 });

    res.json({
      count: staff.length,
      data: staff,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch staff records',
      error: (error as Error).message,
    });
  }
};

export const getStaffById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = extractParamId(req.params.id);

    if (!id) {
      res.status(400).json({ message: 'Invalid staff ID format' });
      return;
    }

    const staff = await Staff.findById(id).select('-__v');

    if (!staff) {
      res.status(404).json({ message: 'Staff not found' });
      return;
    }

    res.json(staff);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch staff record',
      error: (error as Error).message,
    });
  }
};

export const createStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    const existingStaff = await Staff.findOne({
      $or: [
        { email: req.body.email },
        { staffId: req.body.staffId },
      ],
    });

    if (existingStaff) {
      const field = existingStaff.email === req.body.email ? 'email' : 'staffId';
      res.status(409).json({
        message: `Staff with this ${field} already exists`,
      });
      return;
    }

    const staff = await Staff.create(req.body);
    res.status(201).json(staff);
  } catch (error) {
    res.status(400).json({
      message: 'Invalid staff data',
      error: (error as Error).message,
    });
  }
};

export const updateStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = extractParamId(req.params.id);

    if (!id) {
      res.status(400).json({ message: 'Invalid staff ID format' });
      return;
    }

    if (req.body.email || req.body.staffId) {
      const orConditions: Record<string, unknown>[] = [];

      if (req.body.email) {
        orConditions.push({ email: req.body.email });
      }
      if (req.body.staffId) {
        orConditions.push({ staffId: req.body.staffId });
      }

      if (orConditions.length > 0) {
        const duplicate = await Staff.findOne({
          _id: { $ne: new ObjectId(id) },
          $or: orConditions,
        });

        if (duplicate) {
          res.status(409).json({
            message: 'Another staff member already uses this email or staff ID',
          });
          return;
        }
      }
    }

    const staff = await Staff.findByIdAndUpdate(id, req.body, {
      returnDocument: 'after',
      runValidators: true,
    }).select('-__v');

    if (!staff) {
      res.status(404).json({ message: 'Staff not found' });
      return;
    }

    res.json(staff);
  } catch (error) {
    res.status(400).json({
      message: 'Update failed',
      error: (error as Error).message,
    });
  }
};

export const deleteStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = extractParamId(req.params.id);

    if (!id) {
      res.status(400).json({ message: 'Invalid staff ID format' });
      return;
    }

    const staffObjectId = new ObjectId(id);
    const staff = await Staff.findByIdAndDelete(staffObjectId);

    if (!staff) {
      res.status(404).json({ message: 'Staff not found' });
      return;
    }

    await Promise.all([
      Attendance.deleteMany({ staffId: staffObjectId }),
      Leave.deleteMany({ staffId: staffObjectId }),
      Promotion.deleteMany({ staffId: staffObjectId }),
    ]);

    res.json({
      message: 'Staff and all associated records removed successfully',
      deletedStaffId: staff.staffId,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to delete staff',
      error: (error as Error).message,
    });
  }
};

// ─── Staff Search & Filter ──────────────────────────────────────

export const searchStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      q,
      department,
      faculty,
      cadre,
      isActive,
      page = '1',
      limit = '20',
    } = req.query;

    const filter: Record<string, unknown> = {};

    if (q && typeof q === 'string') {
      const searchRegex = new RegExp(q, 'i');
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { staffId: searchRegex },
        { designation: searchRegex },
      ];
    }

    if (department && typeof department === 'string') filter.department = department;
    if (faculty && typeof faculty === 'string') filter.faculty = faculty;
    if (cadre && typeof cadre === 'string') filter.cadre = cadre;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [staff, total] = await Promise.all([
      Staff.find(filter)
        .select('-__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Staff.countDocuments(filter),
    ]);

    res.json({
      data: staff,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: 'Search failed',
      error: (error as Error).message,
    });
  }
};

// ─── Bulk Operations ────────────────────────────────────────────

export const bulkCreateStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    const { staffList } = req.body;

    if (!Array.isArray(staffList) || staffList.length === 0) {
      res.status(400).json({ message: 'staffList must be a non-empty array' });
      return;
    }

    const result = {
      created: 0,
      failed: 0,
      errors: [] as { index: number; error: string }[],
    };

    for (let i = 0; i < staffList.length; i++) {
      try {
        await Staff.create(staffList[i]);
        result.created++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          index: i,
          error: (error as Error).message,
        });
      }
    }

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({
      message: 'Bulk creation failed',
      error: (error as Error).message,
    });
  }
};

// ─── Staff Statistics ───────────────────────────────────────────

export const getStaffStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = await Staff.aggregate([
      {
        $group: {
          _id: null,
          totalActive: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
          },
          totalInactive: {
            $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] },
          },
          academicStaff: {
            $sum: { $cond: [{ $eq: ['$cadre', 'Academic'] }, 1, 0] },
          },
          nonAcademicStaff: {
            $sum: { $cond: [{ $eq: ['$cadre', 'Non-Academic'] }, 1, 0] },
          },
          departments: { $addToSet: '$department' },
          faculties: { $addToSet: '$faculty' },
        },
      },
      {
        $project: {
          _id: 0,
          totalActive: 1,
          totalInactive: 1,
          totalStaff: { $sum: ['$totalActive', '$totalInactive'] },
          academicStaff: 1,
          nonAcademicStaff: 1,
          departmentCount: { $size: '$departments' },
          facultyCount: { $size: '$faculties' },
        },
      },
    ]);

    const defaultStats = {
      totalActive: 0,
      totalInactive: 0,
      totalStaff: 0,
      academicStaff: 0,
      nonAcademicStaff: 0,
      departmentCount: 0,
      facultyCount: 0,
    };

    res.json(stats[0] ?? defaultStats);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to generate staff statistics',
      error: (error as Error).message,
    });
  }
};