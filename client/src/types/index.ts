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