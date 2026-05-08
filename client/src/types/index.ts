export interface IStaff {
  _id: string;
  staffId: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  faculty: string;
  designation: string;
  cadre: 'Academic' | 'Non-Academic';
  dateOfFirstAppointment: string;
  dateOfLastPromotion: string;
  salaryGradeLevel: string;
  bankDetails: {
    accountNumber: string;
    bankName: string;
  };
  isActive: boolean;
  leaveDaysRemaining: number;
  createdAt: string;
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'hr' | 'viewer';
  token: string;
}

export interface IDashboardStats {
  totalStaff: number;
  presentToday: number;
  pendingLeave: number;
  pendingPromotions: number;
  ghostWorkerAlert: string;
}

export interface IAttendance {
  _id: string;
  staffId: IStaff;
  checkIn: string;
  checkOut: string | null;
  status: 'Present' | 'Absent' | 'Late' | 'Half-Day';
  isSyncedOffline: boolean;
}

export interface ILeave {
  _id: string;
  staffId: IStaff;
  leaveType: 'Annual' | 'Sick' | 'Maternity' | 'Study';
  startDate: string;
  endDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvalComment: string;
  appliedDate: string;
}

export interface IPromotion {
  _id: string;
  staffId: IStaff;
  currentDesignation: string;
  proposedDesignation: string;
  currentGradeLevel: string;
  proposedGradeLevel: string;
  eligibilityScore: number;
  status: 'Pending' | 'Vetted' | 'Approved' | 'Rejected';
  vettingDate: string;
}

export interface IVettingResult {
  eligibilityScore: number;
  isEligible: boolean;
  recommendation: string;
  missingRequirements: string[];
}

// Add these to your existing types file:

export interface IAuditLog {
  _id: string;
  action: string;
  entity: string;
  documentId: string;
  changedBy: { _id: string; name: string; email: string; role: string };
  changes: { before?: Record<string, unknown>; after?: Record<string, unknown> };
  description: string;
  ipAddress?: string;
  timestamp: string;
  createdAt: string;
}

export interface IApprovalChain {
  _id: string;
  requestType: 'LEAVE' | 'PROMOTION' | 'SALARY_ADJUSTMENT';
  requestId: string;
  requestModel: string;
  staffId: { _id: string; firstName: string; lastName: string; department: string; faculty: string };
  steps: IApprovalStep[];
  currentStep: number;
  overallStatus: 'IN_PROGRESS' | 'APPROVED' | 'REJECTED';
  initiatedBy: { _id: string; name: string; email: string };
  initiatedAt: string;
  completedAt?: string;
}

export interface IApprovalStep {
  _id: string;
  step: number;
  role: string;
  title: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED';
  approvedBy?: string;
  approvedAt?: string;
  comment?: string;
}

export interface IReconciliationReport {
  generatedAt: string;
  activeStaffCount: number;
  payrollHeadcount: number;
  discrepancy: number;
  ghostWorkerCandidates: { staffId: string; name: string; department: string; lastActive: string }[];
  missingFromPayroll: { staffId: string; name: string; department: string }[];
  salaryGradeChanges: { staffId: string; name: string; oldGrade: string; newGrade: string; date: string }[];
  summary: string;
}

export interface IPayrollStaff {
  staffId: string;
  name: string;
  department: string;
  cadre: string;
  gradeLevel: string;
  monthlySalary: number;
  accountNumber: string;
  bankName: string;
}

export interface IPayrollSummary {
  generatedAt: string;
  totalStaff: number;
  totalMonthlyPayroll: number;
  staff: IPayrollStaff[];
}

export interface IRecentActivity {
  _id: string;
  action: string;
  entity: string;
  description: string;
  changedBy: { _id: string; name: string; email: string };
  timestamp: string;
}