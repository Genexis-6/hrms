import mongoose, { type Document, type InferSchemaType, Schema } from 'mongoose';

const StaffSchema = new Schema({
  staffId: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  faculty: { type: String, required: true },
  designation: { type: String, required: true },
  cadre: { type: String, enum: ['Academic', 'Non-Academic'], required: true },
  dateOfFirstAppointment: { type: Date, required: true },
  dateOfLastPromotion: { type: Date, required: true },
  salaryGradeLevel: { type: String, required: true },
  bankDetails: {
    accountNumber: { type: String, required: true },
    bankName: { type: String, required: true },
  },
  isActive: { type: Boolean, default: true },
  leaveDaysRemaining: { type: Number, default: 30 },
}, {
  timestamps: true,
});
export type IStaff = InferSchemaType<typeof StaffSchema> & Document;
export default mongoose.model<IStaff>('Staff', StaffSchema);