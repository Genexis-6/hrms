import { Router } from 'express';
import { vetPromotion, getAllPromotions } from '../controllers/promotionController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();

router.post('/vet', protect, adminOnly, vetPromotion);
router.get('/', protect, getAllPromotions);

export default router;