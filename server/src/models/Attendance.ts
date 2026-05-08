import mongoose, { type InferSchemaType, Schema } from 'mongoose';

const AttendanceSchema = new Schema({
  staffId: { type: Schema.Types.ObjectId, ref: 'Staff', required: true, index: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, default: null },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late', 'Half-Day'],
    default: 'Present',
  },
  isSyncedOffline: { type: Boolean, default: false },
}, {
  timestamps: true,
});

AttendanceSchema.index({ staffId: 1, checkIn: -1 });
AttendanceSchema.index({ checkIn: -1 });

export type IAttendance = InferSchemaType<typeof AttendanceSchema> & {
  _id: mongoose.Types.ObjectId;
};

const Attendance = mongoose.model('Attendance', AttendanceSchema);
export default Attendance;