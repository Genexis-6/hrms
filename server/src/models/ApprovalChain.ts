import mongoose, { type InferSchemaType, Schema } from 'mongoose';

const ApprovalStepSchema = new Schema({
  step: { type: Number, required: true },
  role: { type: String, enum: ['hod', 'dean', 'registrar', 'bursar', 'vc', 'admin'], required: true },
  title: { type: String, required: true }, // e.g., "Head of Department"
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'SKIPPED'],
    default: 'PENDING',
  },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  comment: { type: String },
}, { _id: true });

const ApprovalChainSchema = new Schema({
  requestType: {
    type: String,
    enum: ['LEAVE', 'PROMOTION', 'SALARY_ADJUSTMENT'],
    required: true,
  },
  requestId: { type: Schema.Types.ObjectId, required: true, refPath: 'requestModel' },
  requestModel: {
    type: String,
    enum: ['Leave', 'Promotion'],
    required: true,
  },
  staffId: { type: Schema.Types.ObjectId, ref: 'Staff', required: true },
  steps: [ApprovalStepSchema],
  currentStep: { type: Number, default: 1 },
  overallStatus: {
    type: String,
    enum: ['IN_PROGRESS', 'APPROVED', 'REJECTED'],
    default: 'IN_PROGRESS',
  },
  initiatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  initiatedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
}, {
  timestamps: true,
});

ApprovalChainSchema.index({ requestType: 1, requestId: 1 }, { unique: true });
ApprovalChainSchema.index({ currentStep: 1, overallStatus: 1 });

export type IApprovalChain = InferSchemaType<typeof ApprovalChainSchema>;
export default mongoose.model('ApprovalChain', ApprovalChainSchema);