import mongoose, { type InferSchemaType, Schema } from 'mongoose';

const PromotionSchema = new Schema({
  staffId: { type: Schema.Types.ObjectId, ref: 'Staff', required: true },
  currentDesignation: { type: String, required: true },
  proposedDesignation: { type: String, required: true },
  currentGradeLevel: { type: String, required: true },
  proposedGradeLevel: { type: String, required: true },
  eligibilityScore: { type: Number, default: 0 },
  status: { type: String, enum: ['Pending', 'Vetted', 'Approved', 'Rejected'], default: 'Pending' },
  vettingDate: { type: Date },
});

export type IPromotion = InferSchemaType<typeof PromotionSchema>;
export default mongoose.model('Promotion', PromotionSchema);