import type { IStaff } from '../models/Staff.js';

interface VettingResult {
  eligibilityScore: number;
  isEligible: boolean;
  recommendation: string;
  missingRequirements: string[];
}

export const vetPromotionEligibility = (staff: IStaff, requiredYears: number = 3): VettingResult => {
  const today = new Date();
  const lastPromotion = new Date(staff.dateOfLastPromotion);
  const yearsSinceLastPromotion = (today.getTime() - lastPromotion.getTime()) / (1000 * 60 * 60 * 24 * 365);

  const requiredCourses = 5;
  const completedCourses = 4;

  let score = 0;
  const missing: string[] = [];

  if (yearsSinceLastPromotion >= requiredYears) {
    score += 50;
  } else {
    missing.push(`Requires ${requiredYears} years in current grade. Current: ${yearsSinceLastPromotion.toFixed(1)} years`);
  }

  if (completedCourses >= requiredCourses) {
    score += 30;
  } else {
    missing.push(`Incomplete mandatory training: ${completedCourses}/${requiredCourses} completed`);
  }

  if (staff.isActive) {
    score += 20;
  } else {
    missing.push('Staff record is inactive or under disciplinary review');
  }

  return {
    eligibilityScore: score,
    isEligible: score >= 70,
    recommendation: score >= 70 ? 'Highly Eligible' : score >= 50 ? 'Conditional' : 'Not Eligible',
    missingRequirements: missing,
  };
};

export const detectGhostWorkers = (activeStaffCount: number, payrollCount: number) => {
  const ghostCount = payrollCount - activeStaffCount;
  return {
    discrepancy: ghostCount > 0,
    ghostCount: ghostCount > 0 ? ghostCount : 0,
    message:
      ghostCount > 0
        ? `ALERT: ${ghostCount} potential ghost worker(s) detected. Payroll exceeds active staff by ${ghostCount}.`
        : 'No discrepancy found. Staff count matches payroll.',
  };
};