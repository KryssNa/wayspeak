import { Router } from 'express';
import { messageController } from '../controllers/message.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Send a message
router.post('/', messageController.sendMessage.bind(messageController));

// Get all messages for the authenticated user
router.get('/', messageController.getMessages.bind(messageController));

// Get a specific message by id
router.get('/:id', messageController.getMessage.bind(messageController));

// Get messages by session id
router.get('/session/:sessionId', messageController.getMessagesBySession.bind(messageController));

export default router;
