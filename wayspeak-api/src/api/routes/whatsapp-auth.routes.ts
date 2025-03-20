// src/api/routes/whatsapp-auth.routes.ts
import { Router } from 'express';
import { whatsappAuthController } from '../controllers/whatsapp-auth.controller';

const router:Router = Router();

// Generate QR code for authentication
router.post('/qr', whatsappAuthController.generateQR);

// Check authentication status
router.get('/status/:clientId', whatsappAuthController.checkStatus);

// Handle successful authentication
router.post('/complete', whatsappAuthController.handleAuthenticated);

export default router;