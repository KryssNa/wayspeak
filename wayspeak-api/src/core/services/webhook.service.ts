// src/core/services/webhook.service.ts
import { ObjectId } from 'mongodb';
import axios from 'axios';
import crypto from 'crypto';
import { WebhookModel, IWebhook, WebhookStatus, WebhookEvent } from '../models/webhook.model';
import { AppError } from '../../utils/errors/app-error';
import logger from '../../utils/logging/logger';

interface CreateWebhookParams {
  userId: string;
  url: string;
  events: string[];
  description?: string;
}

class WebhookService {
  private webhookModel: WebhookModel;
  
  constructor() {
    this.webhookModel = new WebhookModel();
  }

  /**
   * Create a new webhook
   */
  async createWebhook(params: CreateWebhookParams): Promise<IWebhook> {
    try {
      // Validate events
      const validatedEvents = this.validateEvents(params.events);
      
      // Generate a webhook secret
      const secret = this.generateSecret();
      
      // Create the webhook record
      const webhook = await this.webhookModel.create({
        userId: new ObjectId(params.userId),
        url: params.url,
        events: validatedEvents,
        description: params.description,
        status: WebhookStatus.ACTIVE,
        secret,
      });
      
      return webhook;
    } catch (error) {
      logger.error('Error creating webhook', { error, params });
      throw error;
    }
  }

  /**
   * Get a webhook by ID
   */
  async getWebhookById(id: string, userId: string): Promise<IWebhook | null> {
    try {
      return this.webhookModel.getById(id, userId);
    } catch (error) {
      logger.error('Error getting webhook', { error, id, userId });
      throw error;
    }
  }

  /**
   * Get webhooks by user ID
   */
  async getWebhooksByUserId(userId: string): Promise<IWebhook[]> {
    try {
      return this.webhookModel.getByUserId(userId);
    } catch (error) {
      logger.error('Error getting webhooks by user ID', { error, userId });
      throw error;
    }
  }

  /**
   * Update a webhook
   */
  async updateWebhook(id: string, userId: string, updates: Partial<IWebhook>): Promise<boolean> {
    try {
      // If updating events, validate them
      if (updates.events) {
        updates.events = this.validateEvents(updates.events as any);
      }
      
      return this.webhookModel.update(id, userId, updates);
    } catch (error) {
      logger.error('Error updating webhook', { error, id, userId, updates });
      throw error;
    }
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(id: string, userId: string): Promise<boolean> {
    try {
      return this.webhookModel.delete(id, userId);
    } catch (error) {
      logger.error('Error deleting webhook', { error, id, userId });
      throw error;
    }
  }

  /**
   * Trigger webhook events
   */
  async triggerEvent(event: WebhookEvent, payload: any): Promise<void> {
    try {
      // Get all active webhooks for this event
      const webhooks = await this.webhookModel.getByEvent(event);
      
      if (!webhooks || webhooks.length === 0) {
        return;
      }
      
      // Prepare the event payload
      const eventPayload = {
        event,
        timestamp: new Date().toISOString(),
        data: payload,
      };
      
      // Send webhooks in parallel
      const sendPromises = webhooks.map(webhook => this.sendWebhook(webhook, eventPayload));
      
      // Wait for all webhooks to be sent (but don't block)
      Promise.all(sendPromises).catch(error => {
        logger.error('Error sending webhooks', { error, event });
      });
    } catch (error) {
      logger.error('Error triggering webhook event', { error, event });
    }
  }

  /**
   * Send a webhook to its destination URL
   */
  private async sendWebhook(webhook: IWebhook, payload: any): Promise<void> {
    try {
      // Add webhook ID to payload
      const webhookPayload = {
        ...payload,
        webhook_id: webhook._id!.toString(),
      };
      
      // Generate signature if webhook has a secret
      const headers: any = {
        'Content-Type': 'application/json',
      };
      
      if (webhook.secret) {
        const signature = this.generateSignature(webhookPayload, webhook.secret);
        headers['X-Webhook-Signature'] = signature;
      }
      
      // Send the webhook
      await axios.post(webhook.url, webhookPayload, {
        headers,
        timeout: 10000, // 10 second timeout
      });
      
      // Update last triggered time and reset fail count
      await this.webhookModel.updateLastTriggered(webhook._id!.toString());
      if (webhook.failCount && webhook.failCount > 0) {
        await this.webhookModel.resetFailCount(webhook._id!.toString());
      }
    } catch (error) {
      logger.error('Error sending webhook', { 
        error, 
        webhookId: webhook._id,
        url: webhook.url,
        event: payload.event 
      });
      
      // Increment fail count
      await this.webhookModel.incrementFailCount(webhook._id!.toString());
      
      // If fail count is too high, disable the webhook
      const MAX_FAILURES = 10;
      if (webhook.failCount && webhook.failCount >= MAX_FAILURES) {
        await this.webhookModel.update(webhook._id!.toString(), webhook.userId.toString(), {
          status: WebhookStatus.INACTIVE,
        });
        
        logger.warn('Webhook disabled due to too many failures', {
          webhookId: webhook._id,
          url: webhook.url,
          failCount: webhook.failCount + 1,
        });
      }
    }
  }

  /**
   * Validate webhook events
   */
  private validateEvents(events: string[]): WebhookEvent[] {
    const validEvents: WebhookEvent[] = [
      'message.received',
      'message.sent',
      'message.delivered',
      'message.read',
      'message.failed',
    ];
    
    const validatedEvents = events.filter(event => 
      validEvents.includes(event as WebhookEvent)
    ) as WebhookEvent[];
    
    if (validatedEvents.length === 0) {
      throw AppError.badRequest('At least one valid event is required');
    }
    
    return validatedEvents;
  }

  /**
   * Generate a random webhook secret
   */
  private generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate a signature for webhook payload
   */
  private generateSignature(payload: any, secret: string): string {
    const payloadString = JSON.stringify(payload);
    return crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');
  }
}

export const webhookService = new WebhookService();