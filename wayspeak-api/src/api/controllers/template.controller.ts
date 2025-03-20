// src/api/controllers/template.controller.ts

import { Request, Response, NextFunction } from 'express';
import { templateService } from '../../core/services/template.service';
import { AppError } from '../../utils/errors/app-error';
import logger from '../../utils/logging/logger';
import { TemplateStatus } from '../../core/models/template.model';

export class TemplateController {
  /**
   * Create a new message template
   */
  async createTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user._id.toString();
      const { name, content, type, mediaUrl, variables } = req.body;

      // Validate required fields
      if (!name) {
        return next(AppError.badRequest('Template name is required'));
      }

      if (!content) {
        return next(AppError.badRequest('Template content is required'));
      }

      if (!type) {
        return next(AppError.badRequest('Template type is required'));
      }

      // Create template
      const template = await templateService.createTemplate({
        userId,
        name,
        content,
        type,
        mediaUrl,
        variables: variables || [],
      });

      // Return the template
      res.status(201).json({
        status: 'success',
        data: {
          template,
        },
      });
    } catch (error) {
      logger.error('Error creating template', { error, body: req.body });
      next(error);
    }
  }

  /**
   * Get all templates for the current user
   */
  async getTemplates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user._id.toString();
      const status = req.query.status as TemplateStatus;

      const templates = await templateService.getTemplatesByUserId(userId, status);

      res.status(200).json({
        status: 'success',
        results: templates.length,
        data: {
          templates,
        },
      });
    } catch (error) {
      logger.error('Error fetching templates', { error });
      next(error);
    }
  }

  /**
   * Get a specific template by ID
   */
  async getTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user._id.toString();

      const template = await templateService.getTemplateById(id, userId);

      if (!template) {
        return next(AppError.notFound(`Template with ID ${id} not found`));
      }

      res.status(200).json({
        status: 'success',
        data: {
          template,
        },
      });
    } catch (error) {
      logger.error('Error fetching template', { error, id: req.params.id });
      next(error);
    }
  }

  /**
   * Update a template
   */
  async updateTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user._id.toString();
      const { name, content, type, mediaUrl, variables, status } = req.body;

      // Update template
      const updated = await templateService.updateTemplate(id, userId, {
        name,
        content,
        type,
        mediaUrl,
        variables,
        status,
      });

      if (!updated) {
        return next(AppError.internal('Failed to update template'));
      }

      // Get updated template
      const template = await templateService.getTemplateById(id, userId);

      res.status(200).json({
        status: 'success',
        data: {
          template,
        },
      });
    } catch (error) {
      logger.error('Error updating template', { error, id: req.params.id, body: req.body });
      next(error);
    }
  }

  /**
   * Delete a template
   */
  async deleteTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user._id.toString();

      // Delete template
      const deleted = await templateService.deleteTemplate(id, userId);

      if (!deleted) {
        return next(AppError.internal('Failed to delete template'));
      }

      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting template', { error, id: req.params.id });
      next(error);
    }
  }

  /**
   * Preview a template with variables
   */
  async previewTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user._id.toString();
      const { templateId, variables } = req.body;

      if (!templateId) {
        return next(AppError.badRequest('Template ID is required'));
      }

      const preview = await templateService.previewTemplate(templateId, userId, variables || {});

      res.status(200).json({
        status: 'success',
        data: {
          preview,
        },
      });
    } catch (error) {
      logger.error('Error previewing template', { error, body: req.body });
      next(error);
    }
  }

  /**
   * Duplicate a template
   */
  async duplicateTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user._id.toString();
      const { name } = req.body;

      if (!name) {
        return next(AppError.badRequest('New template name is required'));
      }

      const newTemplate = await templateService.duplicateTemplate(id, userId, name);

      res.status(201).json({
        status: 'success',
        data: {
          template: newTemplate,
        },
      });
    } catch (error) {
      logger.error('Error duplicating template', { error, id: req.params.id });
      next(error);
    }
  }
}

export const templateController = new TemplateController();