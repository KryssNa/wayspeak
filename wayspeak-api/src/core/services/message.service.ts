// src/core/services/message.service.ts
import { ObjectId } from 'mongodb';
import { MessageModel, IMessage, MessageStatus, MessageType } from '../models/message.model';
import logger from '../../utils/logging/logger';
import config from '../../config';
import { templateService } from './template.service';
import { webhookService } from './webhook.service';

interface SendMessageParams {
  userId: string;
  to: string;
  content: string;
  type: string;
  mediaUrl?: string;
  sessionId?: string;
  isHighPriority?: boolean;
  metadata?: Record<string, any>;
  templateId?: string;
  variables?: Record<string, any>;
}

class MessageService {
  private messageModel: MessageModel;
  
  constructor() {
    // Initialize the model when the service is constructed
    this.messageModel = new MessageModel();
  }

  /**
   * Send a message
   */
  async sendMessage(params: SendMessageParams): Promise<IMessage> {
    try {
      let finalContent = params.content;
      let finalType = params.type as MessageType;
      let finalMediaUrl = params.mediaUrl;
      
      // If using a template, process it
      if (params.templateId) {
        const templateData = await this.processTemplate(
          params.templateId,
          params.userId,
          params.variables || {}
        );
        
        finalContent = templateData.content;
        finalType = templateData.type as MessageType;
        finalMediaUrl = templateData.mediaUrl || params.mediaUrl;
      }
      
      // Create the message record
      const message = await this.messageModel.create({
        userId: new ObjectId(params.userId),
        to: params.to,
        content: finalContent,
        type: finalType,
        status: MessageStatus.PENDING,
        mediaUrl: finalMediaUrl,
        sessionId: params.sessionId,
        isHighPriority: params.isHighPriority,
        metadata: params.metadata,
        templateId: params.templateId ? params.templateId : undefined,
        templateData: params.variables,
      });
      
      // Send the message to the WhatsApp provider
      // This would be an async operation in production
      this.sendToProvider(message)
        .catch(error => logger.error('Error sending message to provider', { error, messageId: message._id }));
      
      return message;
    } catch (error) {
      logger.error('Error sending message', { error, params });
      throw error;
    }
  }

  /**
   * Get a message by ID
   */
  async getMessageById(id: string, userId: string): Promise<IMessage | null> {
    return this.messageModel.getById(id, userId);
  }

  /**
   * Get messages by session ID
   */
  async getMessagesBySessionId(sessionId: string, userId: string, limit = 50): Promise<IMessage[]> {
    return this.messageModel.getBySessionId(sessionId, userId, limit);
  }

  /**
   * Get unread messages by session ID
   */
  async getUnreadMessagesBySessionId(sessionId: string, userId: string): Promise<IMessage[]> {
    return this.messageModel.getUnreadBySessionId(sessionId, userId);
  }

  /**
   * Get messages by user ID with pagination
   */
  async getMessagesByUserId(userId: string, { limit = 50, offset = 0 }): Promise<IMessage[]> {
    return this.messageModel.getByUserId(userId, { limit, offset });
  }

  /**
   * Update message status
   */
  async updateMessageStatus(id: string, status: MessageStatus): Promise<boolean> {
    return this.messageModel.updateStatus(id, status);
  }

  /**
   * Get all sessions for a user
   */
  async getSessionsByUserId(userId: string): Promise<any[]> {
    return this.messageModel.getSessions(userId);
  }

  /**
   * Process template with variables
   */
  private async processTemplate(templateId: string, userId: string, variables: Record<string, any>): Promise<any> {
    const template = await templateService.getTemplateById(templateId, userId);
    
    if (!template) {
      throw new Error(`Template with ID ${templateId} not found`);
    }
    
    return templateService.processTemplate(template, variables);
  }

  /**
   * Send message to WhatsApp provider
   * This is a placeholder for the actual implementation
   */
  private async sendToProvider(message: IMessage): Promise<void> {
    try {
      // In a real implementation, you would:
      // 1. Format the message for your WhatsApp provider
      // 2. Send an API request to the provider
      // 3. Update the message with provider ID and status
      
      logger.info('Sending message to WhatsApp provider', {
        messageId: message._id,
        to: message.to,
        type: message.type
      });
      
      // Simulate a successful send
      await this.updateMessageStatus(message._id!.toString(), MessageStatus.SENT);
      
      // Trigger webhooks for message.sent event
      webhookService.triggerEvent('message.sent', {
        messageId: message._id,
        userId: message.userId,
        status: MessageStatus.SENT,
        timestamp: new Date()
      }).catch(error => {
        logger.error('Error triggering webhook', { error, messageId: message._id });
      });
    } catch (error) {
      logger.error('Error sending message to provider', { error, messageId: message._id });
      
      // Update status to failed
      await this.updateMessageStatus(message._id!.toString(), MessageStatus.FAILED);
      
      // Trigger webhooks for message.failed event
      webhookService.triggerEvent('message.failed', {
        messageId: message._id,
        userId: message.userId,
        status: MessageStatus.FAILED,
        timestamp: new Date(),
        error: (error as Error).message
      }).catch(e => {
        logger.error('Error triggering webhook', { error: e, messageId: message._id });
      });
    }
  }
}

export const messageService = new MessageService();