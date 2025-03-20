import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get message analytics
router.get('/messages', analyticsController.getMessageAnalytics.bind(analyticsController));

// Get delivery stats
router.get('/delivery-stats', analyticsController.getDeliveryStats.bind(analyticsController));

export default router;
