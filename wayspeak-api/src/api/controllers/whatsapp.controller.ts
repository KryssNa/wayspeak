import { Request, Response, NextFunction } from 'express';
import { whatsAppService } from '../../core/services/whatsapp/whatsapp.service';
import logger from '../../utils/logging/logger';
import { AppError } from '../../utils/errors/app-error';

export class WhatsAppController {
  /**
   * Get all WhatsApp accounts for the current user
   */
  async getAccounts(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user._id.toString();
      
      // Get accounts for user
      const accounts = await whatsAppService.getUserAccounts(userId);
      
      res.status(200).json({
        status: 'success',
        data: {
          accounts
        }
      });
    } catch (error) {
      logger.error('Error getting WhatsApp accounts', { error, userId: req.user._id });
      next(error);
    }
  }
  
  /**
   * Get a specific WhatsApp account
   */
  async getAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user._id.toString();
      const accountId = req.params.id;
      
      // Get account
      const account = await whatsAppService.getAccount(accountId, userId);
      
      if (!account) {
        return next(AppError.notFound(`Account with ID ${accountId} not found`));
      }
      
      res.status(200).json({
        status: 'success',
        data: {
          account
        }
      });
    } catch (error) {
      logger.error('Error getting WhatsApp account', { error, accountId: req.params.id });
      next(error);
    }
  }
  
  /**
   * Disconnect a WhatsApp account
   */
  async disconnectAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user._id.toString();
      const accountId = req.params.id;
      
      // Disconnect account
      const success = await whatsAppService.disconnectAccount(accountId, userId);
      
      if (!success) {
        return next(AppError.badRequest(`Failed to disconnect account ${accountId}`));
      }
      
      res.status(200).json({
        status: 'success',
        data: {
          message: 'Account disconnected successfully'
        }
      });
    } catch (error) {
      logger.error('Error disconnecting WhatsApp account', { error, accountId: req.params.id });
      next(error);
    }
  }
  
  /**
   * Generate QR code for WhatsApp connection
   */
  async generateQR(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user._id.toString();
      const { clientId } = req.body;
      
      // Generate QR code
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
   * Disconnect WhatsApp connection
   */
  async disconnect(req: Request, res: Response, next: NextFunction) {
    try {
      // Disconnect from WhatsApp
      await whatsAppService.disconnect();
      
      res.status(200).json({
        status: 'success',
        data: {
          message: 'WhatsApp disconnected successfully'
        }
      });
    } catch (error) {
      logger.error('Error disconnecting WhatsApp', { error });
      next(error);
    }
  }
  
  /**
   * Get WhatsApp connection status
   */
  async getConnectionStatus(req: Request, res: Response, next: NextFunction) {
    try {
      // Get connection status
      const status = whatsAppService.getStatus();
      
      res.status(200).json({
        status: 'success',
        data: status
      });
    } catch (error) {
      logger.error('Error getting WhatsApp connection status', { error });
      next(error);
    }
  }
}

export const whatsappController = new WhatsAppController();