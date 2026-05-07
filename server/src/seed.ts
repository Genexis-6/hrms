import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Staff from './models/Staff.js';

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/unidel_hrms');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Staff.deleteMany({});

    // Create admin user
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@unidel.edu.ng',
      password: 'admin123',
      role: 'admin',
    });
    console.log(`Admin created: ${admin.email} / admin123`);
    console.log(`Admin ID: ${String(admin._id)}`);

    // Create sample staff
    await Staff.create([
      {
        staffId: 'UNIDEL-001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@unidel.edu.ng',
        department: 'Computer Science',
        faculty: 'Science',
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
        faculty: 'Science',
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
    ]);

    console.log('Sample staff created: 3 records');
    console.log('\n--- Login Credentials ---');
    console.log('Email: admin@unidel.edu.ng');
    console.log('Password: admin123');
    console.log('------------------------\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

void seed();