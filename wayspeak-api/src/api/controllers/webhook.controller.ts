import { Request, Response, NextFunction } from 'express';
import { webhookService } from '../../core/services/webhook.service';
import { AppError } from '../../utils/errors/app-error';

export class WebhookController {
  async createWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user._id.toString();
      const { url, description, events } = req.body;

      // Validate required fields
      if (!url) {
        return next(AppError.badRequest('Webhook URL is required'));
      }

      if (!events || !Array.isArray(events) || events.length === 0) {
        return next(AppError.badRequest('At least one event is required'));
      }

      // Validate URL format
      try {
        new URL(url);
      } catch (error) {
        return next(AppError.badRequest('Invalid URL format'));
      }

      // Validate events
      const validEvents = ['message.received', 'message.sent', 'message.delivered', 'message.read', 'message.failed'];
      const invalidEvents = events.filter(event => !validEvents.includes(event));
      if (invalidEvents.length > 0) {
        return next(AppError.badRequest(`Invalid events: ${invalidEvents.join(', ')}`));
      }

      // Create webhook
      const webhook = await webhookService.createWebhook({
        userId,
        url,
        description,
        events,
      });

      // Return the webhook
      res.status(201).json({
        status: 'success',
        data: {
          webhook,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getWebhooks(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user._id.toString();

      const webhooks = await webhookService.getWebhooksByUserId(userId);

      res.status(200).json({
        status: 'success',
        results: webhooks.length,
        data: {
          webhooks,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user._id.toString();

      const webhook = await webhookService.getWebhookById(id, userId);

      if (!webhook) {
        return next(AppError.notFound(`Webhook with ID ${id} not found`));
      }

      res.status(200).json({
        status: 'success',
        data: {
          webhook,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user._id.toString();
      const { url, description, events, status } = req.body;

      // If updating URL, validate format
      if (url) {
        try {
          new URL(url);
        } catch (error) {
          return next(AppError.badRequest('Invalid URL format'));
        }
      }

      // If updating events, validate
      if (events) {
        if (!Array.isArray(events) || events.length === 0) {
          return next(AppError.badRequest('At least one event is required'));
        }

        const validEvents = ['message.received', 'message.sent', 'message.delivered', 'message.read', 'message.failed'];
        const invalidEvents = events.filter(event => !validEvents.includes(event));
        if (invalidEvents.length > 0) {
          return next(AppError.badRequest(`Invalid events: ${invalidEvents.join(', ')}`));
        }
      }

      // Update webhook
      const updated = await webhookService.updateWebhook(id, userId, {
        url,
        description,
        events,
        status,
      });

      if (!updated) {
        return next(AppError.internal('Failed to update webhook'));
      }

      // Get updated webhook
      const webhook = await webhookService.getWebhookById(id, userId);

      res.status(200).json({
        status: 'success',
        data: {
          webhook,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user._id.toString();

      // Delete webhook
      const deleted = await webhookService.deleteWebhook(id, userId);

      if (!deleted) {
        return next(AppError.internal('Failed to delete webhook'));
      }

      res.status(204).json({
        status: 'success',
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const webhookController = new WebhookController();
