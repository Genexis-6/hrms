import mongoose, { type InferSchemaType, Schema } from 'mongoose';

const LeaveSchema = new Schema({
  staffId: { type: Schema.Types.ObjectId, ref: 'Staff', required: true },
  leaveType: { type: String, enum: ['Annual', 'Sick', 'Maternity', 'Study'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  approvalComment: { type: String, default: '' },
  appliedDate: { type: Date, default: Date.now },
});

export type ILeave = InferSchemaType<typeof LeaveSchema>;
export default mongoose.model('Leave', LeaveSchema);