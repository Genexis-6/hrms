import mongoose, { type InferSchemaType, Schema } from 'mongoose';

const AuditLogSchema = new Schema({
  action: {
    type: String,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'CHECK_IN', 'CHECK_OUT'],
    required: true,
  },
  entity: {
    type: String,
    enum: ['Staff', 'Leave', 'Promotion', 'Attendance', 'User', 'Payroll'],
    required: true,
  },
  documentId: { type: String, required: true }, // Changed from ObjectId to String
  changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  changes: {
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
  },
  description: { type: String, required: true },
  ipAddress: { type: String },
  timestamp: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

AuditLogSchema.index({ entity: 1, documentId: 1 });
AuditLogSchema.index({ changedBy: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });

export type IAuditLog = InferSchemaType<typeof AuditLogSchema>;
export default mongoose.model('AuditLog', AuditLogSchema);