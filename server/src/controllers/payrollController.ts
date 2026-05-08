import type { Request, Response } from 'express';
import { generateReconciliationReport, getSalaryAmount } from '../services/payrollReconciliation.js';
import Staff from '../models/Staff.js';
import type { AuthRequest } from '../middleware/auth.js';

// GET /api/payroll/reconciliation
export const getReconciliation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const payrollHeadcount = parseInt(req.query.payrollCount as string) || 0;
    const report = await generateReconciliationReport(payrollHeadcount, req.user?.id || 'system');
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Reconciliation failed', error: (error as Error).message });
  }
};

// GET /api/payroll/staff-count — For Bursary to query verified headcount
export const getVerifiedStaffCount = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [totalActive, byDepartment, byGrade] = await Promise.all([
      Staff.countDocuments({ isActive: true }),
      Staff.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Staff.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$salaryGradeLevel', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({
      verified: true,
      timestamp: new Date().toISOString(),
      totalActiveStaff: totalActive,
      byDepartment,
      byGrade,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get staff count', error: (error as Error).message });
  }
};

// GET /api/payroll/salary-structure
export const getSalaryStructure = async (_req: Request, res: Response): Promise<void> => {
  try {
    const staff = await Staff.find({ isActive: true })
      .select('staffId firstName lastName department cadre salaryGradeLevel bankDetails')
      .sort('department');

    const payroll = staff.map(s => ({
      staffId: s.staffId,
      name: `${s.firstName} ${s.lastName}`,
      department: s.department,
      cadre: s.cadre,
      gradeLevel: s.salaryGradeLevel,
      monthlySalary: getSalaryAmount(s.salaryGradeLevel),
      accountNumber: s.bankDetails?.accountNumber,
      bankName: s.bankDetails?.bankName,
    }));

    const totalMonthly = payroll.reduce((sum, p) => sum + p.monthlySalary, 0);

    res.json({
      generatedAt: new Date().toISOString(),
      totalStaff: payroll.length,
      totalMonthlyPayroll: totalMonthly,
      staff: payroll,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate payroll', error: (error as Error).message });
  }
};

// GET /api/payroll/grade-changes — Recent salary grade changes for Bursary
export const getRecentGradeChanges = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { default: AuditLog } = await import('../models/AuditLog.js');

    const changes = await AuditLog.find({
      collection: 'Staff',
      action: 'UPDATE',
      'changes.after.salaryGradeLevel': { $exists: true },
      timestamp: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
    })
      .sort('-timestamp')
      .limit(50)
      .populate('changedBy', 'name email');

    const formatted = changes.map(c => ({
      staffId: (c.changes as any)?.after?.staffId || 'Unknown',
      oldGrade: (c.changes as any)?.before?.salaryGradeLevel || 'N/A',
      newGrade: (c.changes as any)?.after?.salaryGradeLevel || 'N/A',
      changedBy: (c.changedBy as any)?.name || 'System',
      date: c.timestamp.toISOString().split('T')[0],
    }));

    res.json({
      totalChanges: formatted.length,
      period: 'Last 90 days',
      changes: formatted,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get grade changes', error: (error as Error).message });
  }
};