import { Request, Response, NextFunction } from 'express';
import { whatsAppService } from '../../core/services/whatsapp/whatsapp.service';
import { userService } from '../../core/services/user.service';
import logger from '../../utils/logging/logger';

export class WhatsAppAuthController {
  /**
   * Generate a QR code for WhatsApp authentication
   */
  async generateQR(req: Request, res: Response, next: NextFunction) {
    try {
      // Generate a QR code
      const clientId = req.body.clientId;
      console.log('clientId', clientId);
      const qrCode = await whatsAppService.generateAuthQR(clientId);
      
      res.status(200).json({
        status: 'success',
        data: {
          qrCode,
          expiresIn: 60, // 60 seconds
          clientId
        }
      });
    } catch (error) {
      logger.error('Error generating WhatsApp QR code', { error });
      next(error);
    }
  }
  
  /**
   * Check authentication status
   */
  async checkStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { clientId } = req.params;
      
      // Check authentication status
      const status = whatsAppService.getAuthStatus(clientId);
      
      res.status(200).json({
        status: 'success',
        data: status
      });
    } catch (error) {
      logger.error('Error checking authentication status', { error });
      next(error);
    }
  }
  
  /**
   * Handle successful authentication
   */
  async handleAuthenticated(req: Request, res: Response, next: NextFunction) {
    try {
      const { whatsappNumber, clientId } = req.body;
      
      // Find or create user with this WhatsApp number
      const { user, token } = await userService.loginWithWhatsApp(whatsappNumber);
      
      // Mark client as authenticated
      whatsAppService.completeAuthentication(clientId, user._id.toString());
      
      // Set cookie with token
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'strict',
      });
      
      res.status(200).json({
        status: 'success',
        data: {
          user,
          token
        }
      });
    } catch (error) {
      logger.error('Error handling WhatsApp authentication', { error });
      next(error);
    }
  }
}

export const whatsappAuthController = new WhatsAppAuthController();