import { Router } from 'express';
import { webhookController } from '../controllers/webhook.controller';
import { messageController } from '../controllers/message.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Webhook configuration routes (require authentication)
router.use('/config', authenticate);
router.post('/config', webhookController.createWebhook.bind(webhookController));
router.get('/config', webhookController.getWebhooks.bind(webhookController));
router.get('/config/:id', webhookController.getWebhook.bind(webhookController));
router.put('/config/:id', webhookController.updateWebhook.bind(webhookController));
router.delete('/config/:id', webhookController.deleteWebhook.bind(webhookController));

// Inbound webhook (does not require authentication)
router.post('/whatsapp', messageController.handleWebhook.bind(messageController));

export default router;
