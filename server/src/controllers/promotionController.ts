import type { Request, Response } from 'express';
import Staff from '../models/Staff.js';
import Promotion from '../models/Promotion.js';
import { vetPromotionEligibility } from '../services/aiVettingEngine.js';
import { createApprovalChain } from '../services/approvalEngine.js';
import { createAuditEntry } from '../middleware/audit.js';
import type { AuthRequest } from '../middleware/auth.js';

export const vetPromotion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { staffId, proposedDesignation, proposedGradeLevel } = req.body;

    const staff = await Staff.findById(staffId);
    if (!staff) {
      res.status(404).json({ message: 'Staff not found' });
      return;
    }

    const vettingResult = vetPromotionEligibility(staff);
    const userId = req.user?.id || 'system';

    const promotion = await Promotion.create({
      staffId,
      currentDesignation: staff.designation,
      proposedDesignation,
      currentGradeLevel: staff.salaryGradeLevel,
      proposedGradeLevel,
      eligibilityScore: vettingResult.eligibilityScore,
      status: vettingResult.isEligible ? 'Vetted' : 'Rejected',
      vettingDate: new Date(),
    });

    const promotionId = String(promotion._id);

    // Create approval chain if eligible
    if (vettingResult.isEligible) {
      await createApprovalChain('PROMOTION', promotionId, 'Promotion', staffId, userId);
    }

    // Audit log
    await createAuditEntry(
      'CREATE',
      'Promotion',
      promotionId,
      userId,
      `Promotion vetting: ${staff.firstName} ${staff.lastName} - ${staff.designation} → ${proposedDesignation}`,
      { after: { proposedDesignation, proposedGradeLevel, score: vettingResult.eligibilityScore } }
    );

    res.status(201).json({
      promotion,
      vettingDetails: vettingResult,
    });
  } catch (error) {
    res.status(500).json({ message: 'Vetting failed', error: (error as Error).message });
  }
};

export const getAllPromotions = async (_req: Request, res: Response): Promise<void> => {
  try {
    const promotions = await Promotion.find()
      .populate('staffId', 'firstName lastName staffId designation department')
      .sort('-vettingDate');
    res.json(promotions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};