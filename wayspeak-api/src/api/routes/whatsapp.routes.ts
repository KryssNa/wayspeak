import { Router } from 'express';
import { whatsappController } from '../controllers/whatsapp.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router:Router = Router();

// Apply authentication middleware to most routes
router.use(authenticate);

// WhatsApp account management
router.get('/accounts', whatsappController.getAccounts.bind(whatsappController));
router.get('/accounts/:id', whatsappController.getAccount.bind(whatsappController));
router.delete('/accounts/:id', whatsappController.disconnectAccount.bind(whatsappController));

// WhatsApp QR code generation
router.post('/qr', whatsappController.generateQR.bind(whatsappController));
router.get('/status/:clientId', whatsappController.checkStatus.bind(whatsappController));

// WhatsApp connection management
router.post('/disconnect', whatsappController.disconnect.bind(whatsappController));
router.get('/status', whatsappController.getConnectionStatus.bind(whatsappController));

export default router;