import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Staff from './models/Staff.js';
import Attendance from './models/Attendance.js';
import Leave from './models/Leave.js';
import Promotion from './models/Promotion.js';
import AuditLog from './models/AuditLog.js';
import ApprovalChain from './models/ApprovalChain.js';

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/unidel_hrms');
    console.log('Connected to MongoDB');

    // Clear ALL existing data
    await Promise.all([
      User.deleteMany({}),
      Staff.deleteMany({}),
      Attendance.deleteMany({}),
      Leave.deleteMany({}),
      Promotion.deleteMany({}),
      AuditLog.deleteMany({}),
      ApprovalChain.deleteMany({}),
    ]);
    console.log('Cleared all existing data');

    // ─── 1. Create Users ─────────────────────────────────────
    const users = await User.create([
      { name: 'System Admin', email: 'admin@unidel.edu.ng', password: 'admin123', role: 'admin' },
      { name: 'Dr. Sarah Okonkwo', email: 'hod.cs@unidel.edu.ng', password: 'hod123', role: 'hod' },
      { name: 'Prof. Adebayo Ojo', email: 'dean.science@unidel.edu.ng', password: 'dean123', role: 'dean' },
      { name: 'Mr. Emmanuel Bassey', email: 'registrar@unidel.edu.ng', password: 'reg123', role: 'registrar' },
      { name: 'Mrs. Fatima Ibrahim', email: 'bursar@unidel.edu.ng', password: 'bur123', role: 'bursar' },
    ]);
    const admin = users[0]!;
    const hod = users[1]!;
    const dean = users[2]!;
    const registrar = users[3]!;
    const bursar = users[4]!;
    console.log('Users created: 5 (admin, hod, dean, registrar, bursar)');

    // ─── 2. Create Staff ─────────────────────────────────────
    const staffList = await Staff.create([
      {
        staffId: 'UNIDEL-001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@unidel.edu.ng',
        department: 'Computer Science',
        faculty: 'Faculty of Science',
        designation: 'Lecturer I',
        cadre: 'Academic',
        dateOfFirstAppointment: new Date('2020-01-15'),
        dateOfLastPromotion: new Date('2023-01-15'),
        salaryGradeLevel: 'CONUASS 4',
        bankDetails: { accountNumber: '1234567890', bankName: 'First Bank' },
        isActive: true,
        leaveDaysRemaining: 30,
      },
      {
        staffId: 'UNIDEL-002',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@unidel.edu.ng',
        department: 'Mathematics',
        faculty: 'Faculty of Science',
        designation: 'Senior Lecturer',
        cadre: 'Academic',
        dateOfFirstAppointment: new Date('2015-08-01'),
        dateOfLastPromotion: new Date('2022-08-01'),
        salaryGradeLevel: 'CONUASS 5',
        bankDetails: { accountNumber: '0987654321', bankName: 'GTBank' },
        isActive: true,
        leaveDaysRemaining: 15,
      },
      {
        staffId: 'UNIDEL-003',
        firstName: 'Michael',
        lastName: 'Okafor',
        email: 'michael.okafor@unidel.edu.ng',
        department: 'Registry',
        faculty: 'Administration',
        designation: 'Principal Assistant Registrar',
        cadre: 'Non-Academic',
        dateOfFirstAppointment: new Date('2012-03-10'),
        dateOfLastPromotion: new Date('2021-03-10'),
        salaryGradeLevel: 'CONTISS 12',
        bankDetails: { accountNumber: '5566778899', bankName: 'UBA' },
        isActive: true,
        leaveDaysRemaining: 22,
      },
      {
        staffId: 'UNIDEL-004',
        firstName: 'Grace',
        lastName: 'Eze',
        email: 'grace.eze@unidel.edu.ng',
        department: 'Bursary',
        faculty: 'Administration',
        designation: 'Senior Accountant',
        cadre: 'Non-Academic',
        dateOfFirstAppointment: new Date('2018-05-20'),
        dateOfLastPromotion: new Date('2023-05-20'),
        salaryGradeLevel: 'CONTISS 10',
        bankDetails: { accountNumber: '1122334455', bankName: 'Zenith Bank' },
        isActive: false,
        leaveDaysRemaining: 0,
      },
    ]);

    const john = staffList[0]!;
    const jane = staffList[1]!;
    const michael = staffList[2]!;
    const grace = staffList[3]!;
    console.log('Staff created: 4 (3 active, 1 inactive-ghost candidate)');

    // ─── 3. Create Attendance Records ─────────────────────────
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 7, 45, 0);
    const todayStartLate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 30, 0);

    await Attendance.create([
      {
        staffId: john._id,
        checkIn: todayStart,
        checkOut: new Date(),
        status: 'Present',
      },
      {
        staffId: jane._id,
        checkIn: todayStartLate,
        status: 'Late',
      },
      {
        staffId: michael._id,
        checkIn: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 15, 0),
        status: 'Present',
      },
    ]);
    console.log('Attendance: 3 records (1 checked out, 1 late, 1 active)');

    // ─── 4. Create Leave Applications ─────────────────────────
    const leave1 = await Leave.create({
      staffId: jane._id,
      leaveType: 'Annual',
      startDate: new Date('2026-06-15'),
      endDate: new Date('2026-06-29'),
      status: 'Pending',
      approvalComment: 'AI Recommendation: Recommended (Score: 85%)',
      appliedDate: new Date(),
    });

    const leave2 = await Leave.create({
      staffId: john._id,
      leaveType: 'Sick',
      startDate: new Date('2026-05-10'),
      endDate: new Date('2026-05-12'),
      status: 'Approved',
      approvalComment: 'Approved by HOD',
      appliedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    });
    console.log('Leave: 2 applications (1 pending, 1 approved)');

    // ─── 5. Create Promotion Vetting ──────────────────────────
    const promotion1 = await Promotion.create({
      staffId: john._id,
      currentDesignation: 'Lecturer I',
      proposedDesignation: 'Senior Lecturer',
      currentGradeLevel: 'CONUASS 4',
      proposedGradeLevel: 'CONUASS 5',
      eligibilityScore: 78,
      status: 'Vetted',
      vettingDate: new Date(),
    });
    console.log('Promotion: 1 record (vetted, awaiting approval)');

    // ─── 6. Create Approval Chains ────────────────────────────
    await ApprovalChain.create({
      requestType: 'LEAVE',
      requestId: leave1._id,
      requestModel: 'Leave',
      staffId: jane._id,
      steps: [
        { step: 1, role: 'hod', title: 'Head of Department', status: 'PENDING' },
        { step: 2, role: 'dean', title: 'Dean of Faculty', status: 'PENDING' },
        { step: 3, role: 'registrar', title: 'Registrar', status: 'PENDING' },
      ],
      currentStep: 1,
      overallStatus: 'IN_PROGRESS',
      initiatedBy: admin._id,
      initiatedAt: new Date(),
    });

    await ApprovalChain.create({
      requestType: 'PROMOTION',
      requestId: promotion1._id,
      requestModel: 'Promotion',
      staffId: john._id,
      steps: [
        { step: 1, role: 'hod', title: 'Head of Department', status: 'APPROVED', approvedBy: hod._id, approvedAt: new Date(), comment: 'Strongly recommend' },
        { step: 2, role: 'dean', title: 'Dean of Faculty', status: 'PENDING' },
        { step: 3, role: 'registrar', title: 'Registrar', status: 'PENDING' },
        { step: 4, role: 'vc', title: 'Vice Chancellor', status: 'PENDING' },
      ],
      currentStep: 2,
      overallStatus: 'IN_PROGRESS',
      initiatedBy: admin._id,
      initiatedAt: new Date(),
    });
    console.log('Approval Chains: 2 (leave at step 1, promotion at step 2)');


    console.log('Audit Logs: 8 entries created');

    console.log('\n═══════════════════════════════════════');
    console.log('  UNIDEL HRMS — Seed Complete');
    console.log('═══════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

void seed();