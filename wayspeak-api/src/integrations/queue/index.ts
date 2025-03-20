// src/integrations/queue/index.ts

import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import Queue from 'bull';
import { Express } from 'express';

import config from '../../config';
import { messageService } from '../../core/services/message.service';
import { emitToUser, SocketEvents } from '../../sockets';
import logger from '../../utils/logging/logger';
import { MessageStatus } from '../../core/models/message.model';

// Define job types
export interface MessageJob {
  messageId: string;
  userId: string;
}

export interface WebhookJob {
  webhookId: string;
  event: string;
  payload: any;
}

// Create queue instances
export const messageQueue = new Queue<MessageJob>('messages', config.redis.url, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 200 // Keep last 200 failed jobs
  }
});

export const webhookQueue = new Queue<WebhookJob>('webhooks', config.redis.url, {
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: 50,
    removeOnFail: 100
  }
});

// Set up Bull Board for monitoring queues
export const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

export function setupBullBoard(app: Express): void {
  createBullBoard({
    queues: [
      new BullAdapter(messageQueue),
      new BullAdapter(webhookQueue),
    ],
    serverAdapter
  });

  // Secure the dashboard in production
  if (config.server.env === 'production') {
    app.use('/admin/queues', (req, res, next) => {
      const authHeader = req.headers.authorization;
      if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
        res.status(401).send('Unauthorized');
        return;
      }
      next();
    });
  }

  app.use('/admin/queues', serverAdapter.getRouter());
}

// Set up queue processors
export async function setupQueues(): Promise<void> {
  logger.info('Setting up message queues');

  // Process messages
  messageQueue.process(async (job) => {
    try {
      const { messageId, userId } = job.data;
      logger.info(`Processing message: ${messageId} for user: ${userId}`);

      // Get message from database
      const message = await messageService.getMessageById(messageId, userId);

      // Simulate sending message (in a real app, this would call the WhatsApp API)
      // This would be fully implemented in the messageService.sendMessageToWhatsApp method

      // Update status to sent
      await messageService.updateMessageStatus(messageId, MessageStatus.SENT,
      //    {
      //   processingTime: Date.now() - job.timestamp,
      //   attempts: job.attemptsMade + 1
      // }
    );

      // Notify user via WebSocket
      emitToUser(userId, SocketEvents.MESSAGE_SENT, {
        messageId,
        status: 'sent',
        timestamp: new Date()
      });

      return { success: true, messageId };
    } catch (error) {
      logger.error('Error processing message job', { error, jobData: job.data });
      throw error;
    }
  });

  // Process webhooks
  webhookQueue.process(async (job) => {
    try {
      const { webhookId, event, payload } = job.data;
      logger.info(`Processing webhook: ${webhookId} for event: ${event}`);

      // In a real implementation, this would send an HTTP request to the webhook URL
      // Currently this is handled in webhookService.triggerWebhooks

      return { success: true, webhookId, event };
    } catch (error) {
      logger.error('Error processing webhook job', { error, jobData: job.data });
      throw error;
    }
  });

  // Handle queue events
  messageQueue.on('completed', (job) => {
    logger.info(`Message job ${job.id} completed successfully`, { messageId: job.data.messageId });
  });

  messageQueue.on('failed', (job, error) => {
    logger.error(`Message job ${job.id} failed`, {
      error,
      messageId: job.data.messageId,
      attempts: job.attemptsMade
    });

    // If job has failed its final attempt, update message status
    if (job.attemptsMade >= (job.opts.attempts || 3)) {
      messageService.updateMessageStatus(job.data.messageId, MessageStatus.FAILED,);

      // Notify user via WebSocket
      emitToUser(job.data.userId, SocketEvents.MESSAGE_FAILED, {
        messageId: job.data.messageId,
        error: error.message,
        timestamp: new Date()
      });
    }
  });

  webhookQueue.on('failed', (job, error) => {
    logger.error(`Webhook job ${job.id} failed`, {
      error,
      webhookId: job.data.webhookId,
      attempts: job.attemptsMade
    });
  });

  logger.info('Message queues setup completed');
}

// Add message to queue
export async function queueMessage(messageId: string, userId: string): Promise<void> {
  await messageQueue.add({
    messageId,
    userId
  });
}

// Add webhook to queue
export async function queueWebhook(webhookId: string, event: string, payload: any): Promise<void> {
  await webhookQueue.add({
    webhookId,
    event,
    payload
  });
}