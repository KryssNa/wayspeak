// src/api/controllers/session.controller.ts

import { Request, Response, NextFunction } from 'express';
import { messageService } from '../../core/services/message.service';
import { AppError } from '../../utils/errors/app-error';
import logger from '../../utils/logging/logger';
import { MessageStatus } from '../../core/models/message.model';

export class SessionController {
  /**
   * Get all sessions (conversations) for the current user
   */
  async getSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user._id.toString();
      
      const sessions = await messageService.getSessionsByUserId(userId);
      
      res.status(200).json({
        status: 'success',
        results: sessions.length,
        data: {
          sessions
        }
      });
    } catch (error) {
      logger.error('Error getting sessions', { error });
      next(error);
    }
  }

  /**
   * Get messages for a specific session (conversation)
   */
  async getSessionMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.params;
      const userId = req.user._id.toString();
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      const messages = await messageService.getMessagesBySessionId(sessionId, userId, limit);
      
      res.status(200).json({
        status: 'success',
        results: messages.length,
        data: {
          messages
        }
      });
    } catch (error) {
      logger.error('Error getting session messages', { error, sessionId: req.params.sessionId });
      next(error);
    }
  }

  /**
   * Send a message in a session (conversation)
   */
  async sendSessionMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.params;
      const userId = req.user._id.toString();
      const { to, content, type, mediaUrl, isHighPriority, metadata, templateId, variables } = req.body;
      
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
        sessionId, // Use the session ID from the URL
        isHighPriority,
        metadata,
        templateId,
        variables,
      });
      
      res.status(201).json({
        status: 'success',
        data: {
          message
        }
      });
    } catch (error) {
      logger.error('Error sending session message', { 
        error, 
        sessionId: req.params.sessionId,
        body: req.body
      });
      next(error);
    }
  }

  /**
   * Mark all messages in a session as read
   */
  async markSessionAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.params;
      const userId = req.user._id.toString();
      
      // Get all unread messages in the session
      const messages = await messageService.getUnreadMessagesBySessionId(sessionId, userId);
      
      // Mark each message as read
      const updatePromises = messages.map(message => 
        messageService.updateMessageStatus(message._id!.toString(), MessageStatus.SENT)
      );
      
      await Promise.all(updatePromises);
      
      res.status(200).json({
        status: 'success',
        data: {
          markedCount: messages.length
        }
      });
    } catch (error) {
      logger.error('Error marking session as read', { error, sessionId: req.params.sessionId });
      next(error);
    }
  }
}

export const sessionController = new SessionController();