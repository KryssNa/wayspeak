import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Public routes
router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));
router.post('/refresh-token', authController.refreshToken.bind(authController));

// Protected routes
router.use(authenticate);
router.get('/me', authController.getProfile.bind(authController));
router.patch('/update-profile', authController.updateProfile.bind(authController));
router.post('/change-password', authController.changePassword.bind(authController));
router.post('/logout', authController.logout.bind(authController));

export default router;
