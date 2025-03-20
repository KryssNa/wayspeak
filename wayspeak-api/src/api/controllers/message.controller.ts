import { Request, Response, NextFunction } from 'express';
import { messageService } from '../../core/services/message.service';
import { AppError } from '../../utils/errors/app-error';
import logger from '../../utils/logging/logger';
import { MessageStatus } from '../../core/models/message.model';

export class MessageController {
  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user._id.toString();
      const { to, content, type, mediaUrl, sessionId, isHighPriority, metadata, templateId, variables } = req.body;

      // Validate required fields
      if (!to) {
        return next(AppError.badRequest('Recipient (to) is required'));
      }

      if (!content && !templateId) {
        return next(AppError.badRequest('Either content or templateId is required'));
      }

      if (!type && !templateId) {
        return next(AppError.badRequest('Either type or templateId is required'));
      }

      // Validate media URL for media messages
      if (type && ['image', 'audio', 'video', 'document'].includes(type) && !mediaUrl && !templateId) {
        return next(AppError.badRequest(`Media URL is required for ${type} messages`));
      }

      // Send the message
      const message = await messageService.sendMessage({
        userId,
        to,
        content: content || '',
        type: type || 'text',
        mediaUrl,
        sessionId,
        isHighPriority,
        metadata,
        templateId,
        variables,
      });

      // Return the message
      res.status(201).json({
        status: 'success',
        data: {
          message,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user._id.toString();

      const message = await messageService.getMessageById(id, userId);

      res.status(200).json({
        status: 'success',
        data: {
          message,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getMessagesBySession(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      const userId = req.user._id.toString();
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const messages = await messageService.getMessagesBySessionId(sessionId, userId, limit);

      res.status(200).json({
        status: 'success',
        results: messages.length,
        data: {
          messages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user._id.toString();
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const messages = await messageService.getMessagesByUserId(userId, { limit, offset });

      res.status(200).json({
        status: 'success',
        results: messages.length,
        data: {
          messages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      // Process webhook payload
      const payload = req.body;

      // Log the webhook payload for debugging
      logger.debug('Received webhook payload', { payload });

      // Always respond quickly to webhooks to avoid timeouts
      res.status(200).json({ status: 'success' });

      // Process webhook asynchronously
      this.processWebhookAsync(payload);
    } catch (error) {
      // Even in case of error, return 200 to acknowledge receipt
      logger.error('Error processing webhook', { error });
      res.status(200).json({ status: 'received' });
    }
  }

  private async processWebhookAsync(payload: any): Promise<void> {
    try {
      // Implementation depends on webhook structure from your WhatsApp provider
      // This is a placeholder for the actual implementation

      // Example implementation for handling message status updates
      if (payload.type === 'message_status') {
        const { message_id, status } = payload;

        // Map provider status to our application status
        const mappedStatus = this.mapProviderStatus(status);

        // Update message status in database
        await messageService.updateMessageStatus(message_id, mappedStatus);
      }
    } catch (error) {
      // Log error but don't propagate
      logger.error('Error in async webhook processing', { error, payload });
    }
  }

  private mapProviderStatus(providerStatus: string): MessageStatus {
    // Map provider-specific status to our application status
    switch (providerStatus) {
      case 'sent':
        return MessageStatus.SENT;
      case 'delivered':
        return MessageStatus.DELIVERED;
      case 'read':
        return MessageStatus.READ;
      case 'failed':
        return MessageStatus.FAILED;
      default:
        return MessageStatus.PENDING;
    }
  }
}

export const messageController = new MessageController();
