import type { IStaff } from '../models/Staff.js';

// ─── Types ──────────────────────────────────────────────────

export interface VettingResult {
  eligibilityScore: number;
  isEligible: boolean;
  recommendation: string;
  missingRequirements: string[];
  detailedBreakdown: {
    timeInGrade: { score: number; maxScore: number; detail: string };
    mandatoryTraining: { score: number; maxScore: number; detail: string };
    disciplinaryStatus: { score: number; maxScore: number; detail: string };
    leaveBalance: { score: number; maxScore: number; detail: string };
  };
}

export interface LeaveEligibilityResult {
  isEligible: boolean;
  score: number;
  recommendation: string;
  leaveDaysAvailable: number;
  leaveDaysRequested: number;
  warnings: string[];
}

// ─── Promotion Vetting ──────────────────────────────────────

export const vetPromotionEligibility = (
  staff: IStaff,
  requiredYears: number = 3,
  completedTrainings: number = 0,
  requiredTrainings: number = 5,
  hasDisciplinaryCase: boolean = false
): VettingResult => {
  const today = new Date();
  const lastPromotion = new Date(staff.dateOfLastPromotion);
  const yearsSinceLastPromotion =
    (today.getTime() - lastPromotion.getTime()) / (1000 * 60 * 60 * 24 * 365);

  const missing: string[] = [];

  // Time in grade assessment (50 points)
  const timeInGradeScore = Math.min(50, (yearsSinceLastPromotion / requiredYears) * 50);
  const timeInGradeDetail =
    yearsSinceLastPromotion >= requiredYears
      ? `Meets requirement: ${yearsSinceLastPromotion.toFixed(1)} years in current grade (min: ${requiredYears})`
      : `Below requirement: ${yearsSinceLastPromotion.toFixed(1)} of ${requiredYears} required years`;

  if (yearsSinceLastPromotion < requiredYears) {
    missing.push(`Requires ${requiredYears} years in current grade. Currently: ${yearsSinceLastPromotion.toFixed(1)} years`);
  }

  // Training assessment (30 points)
  const trainingScore = (completedTrainings / requiredTrainings) * 30;
  const trainingDetail =
    completedTrainings >= requiredTrainings
      ? `All mandatory training completed: ${completedTrainings}/${requiredTrainings}`
      : `Incomplete training: ${completedTrainings}/${requiredTrainings} courses`;

  if (completedTrainings < requiredTrainings) {
    missing.push(`Incomplete mandatory training: ${completedTrainings}/${requiredTrainings} completed`);
  }

  // Disciplinary status (20 points)
  const disciplinaryScore = hasDisciplinaryCase ? 0 : 20;
  const disciplinaryDetail = hasDisciplinaryCase
    ? 'Active disciplinary case found — promotion blocked'
    : 'No disciplinary issues';

  if (hasDisciplinaryCase) {
    missing.push('Staff has active disciplinary case — not eligible');
  }

  const totalScore = timeInGradeScore + trainingScore + disciplinaryScore;

  return {
    eligibilityScore: Math.round(totalScore),
    isEligible: totalScore >= 70 && !hasDisciplinaryCase,
    recommendation: totalScore >= 80 ? 'Highly Recommended' : totalScore >= 70 ? 'Recommended with Conditions' : 'Not Recommended',
    missingRequirements: missing,
    detailedBreakdown: {
      timeInGrade: { score: Math.round(timeInGradeScore), maxScore: 50, detail: timeInGradeDetail },
      mandatoryTraining: { score: Math.round(trainingScore), maxScore: 30, detail: trainingDetail },
      disciplinaryStatus: { score: disciplinaryScore, maxScore: 20, detail: disciplinaryDetail },
      leaveBalance: { score: 0, maxScore: 0, detail: 'Not applicable' },
    },
  };
};

// ─── Leave Eligibility ──────────────────────────────────────

export const vetLeaveEligibility = (
  staff: IStaff,
  requestedDays: number,
  leaveType: string
): LeaveEligibilityResult => {
  const warnings: string[] = [];
  let score = 100;

  const leaveDaysAvailable = staff.leaveDaysRemaining || 30;

  // Check sufficient leave balance
  if (requestedDays > leaveDaysAvailable) {
    score -= 60;
    warnings.push(`Insufficient leave balance: requested ${requestedDays} days, only ${leaveDaysAvailable} available`);
  } else {
    score -= Math.round((requestedDays / leaveDaysAvailable) * 20);
  }

  // Check leave type restrictions
  if (leaveType === 'Maternity' && staff.cadre !== 'Academic') {
    score -= 10;
    warnings.push('Maternity leave policy may differ for non-academic staff');
  }

  if (leaveType === 'Study' && requestedDays > 90) {
    score -= 15;
    warnings.push('Study leave exceeding 90 days requires council approval');
  }

  // Staff must be active
  if (!staff.isActive) {
    score = 0;
    warnings.push('Inactive staff cannot apply for leave');
  }

  return {
    isEligible: score >= 50 && staff.isActive,
    score: Math.max(0, score),
    recommendation: score >= 80 ? 'Recommended' : score >= 50 ? 'Conditional Approval' : 'Not Recommended',
    leaveDaysAvailable,
    leaveDaysRequested: requestedDays,
    warnings,
  };
};

// ─── Ghost Worker Detection ─────────────────────────────────

export const detectGhostWorkers = (
  activeStaffCount: number,
  payrollCount: number
): { discrepancy: boolean; ghostCount: number; percentage: string; severity: 'low' | 'medium' | 'high'; message: string } => {
  const ghostCount = payrollCount > activeStaffCount ? payrollCount - activeStaffCount : 0;
  const percentage = payrollCount > 0 ? ((ghostCount / payrollCount) * 100).toFixed(1) : '0';

  let severity: 'low' | 'medium' | 'high' = 'low';
  if (ghostCount > 10 || parseFloat(percentage) > 10) severity = 'high';
  else if (ghostCount > 5 || parseFloat(percentage) > 5) severity = 'medium';

  return {
    discrepancy: ghostCount > 0,
    ghostCount,
    percentage: `${percentage}%`,
    severity,
    message:
      ghostCount > 0
        ? `⚠️ ALERT: ${ghostCount} potential ghost worker(s) detected (${percentage}% of payroll). Payroll exceeds active staff count.`
        : '✅ No discrepancy found. Staff count matches payroll records.',
  };
};

// ─── Predictive Analytics ───────────────────────────────────

export const predictUpcomingPromotions = (
  staffList: IStaff[],
  monthsAhead: number = 6
): { staffId: string; name: string; monthsUntilEligible: number; readinessScore: number }[] => {
  const today = new Date();
  const upcoming: { staffId: string; name: string; monthsUntilEligible: number; readinessScore: number }[] = [];

  for (const staff of staffList) {
    const lastPromotion = new Date(staff.dateOfLastPromotion);
    const yearsSince = (today.getTime() - lastPromotion.getTime()) / (1000 * 60 * 60 * 24 * 365);
    const monthsUntil = Math.max(0, (3 - yearsSince) * 12);

    if (monthsUntil <= monthsAhead && staff.isActive) {
      upcoming.push({
        staffId: staff.staffId,
        name: `${staff.firstName} ${staff.lastName}`,
        monthsUntilEligible: Math.round(monthsUntil),
        readinessScore: Math.round(Math.max(0, 100 - monthsUntil * 2.8)),
      });
    }
  }

  return upcoming.sort((a, b) => a.monthsUntilEligible - b.monthsUntilEligible);
};