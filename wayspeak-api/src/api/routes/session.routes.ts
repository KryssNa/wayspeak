// src/api/routes/session.routes.ts

import { Router } from 'express';
import { sessionController } from '../controllers/session.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router:Router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all sessions for the authenticated user
router.get('/', sessionController.getSessions.bind(sessionController));

// Get messages for a specific session
router.get('/:sessionId/messages', sessionController.getSessionMessages.bind(sessionController));

// Send a message in a session
router.post('/:sessionId/messages', sessionController.sendSessionMessage.bind(sessionController));

// Mark all messages in a session as read
router.post('/:sessionId/read', sessionController.markSessionAsRead.bind(sessionController));

export default router;