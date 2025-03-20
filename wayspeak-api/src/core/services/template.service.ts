// src/core/services/template.service.ts
import { ObjectId } from 'mongodb';
import { AppError } from '../../utils/errors/app-error';
import logger from '../../utils/logging/logger';
import { ITemplate, TemplateModel, TemplateStatus, TemplateType } from '../models/template.model';

interface CreateTemplateParams {
  userId: string;
  name: string;
  content: string;
  type: string;
  mediaUrl?: string;
  variables?: string[];
}

class TemplateService {
  private templateModel: TemplateModel;

  constructor() {
    this.templateModel = new TemplateModel();
  }

  /**
   * Create a new template
   */
  async createTemplate(params: CreateTemplateParams): Promise<ITemplate> {
    try {
      // Validate template type
      if (!Object.values(TemplateType).includes(params.type as TemplateType)) {
        throw AppError.badRequest(`Invalid template type: ${params.type}`);
      }

      // Create the template record
      const template = await this.templateModel.create({
        userId: new ObjectId(params.userId),
        name: params.name,
        content: params.content,
        type: params.type as TemplateType,
        mediaUrl: params.mediaUrl,
        variables: params.variables,
        status: TemplateStatus.ACTIVE,
      });

      return template;
    } catch (error) {
      logger.error('Error creating template', { error, params });
      throw error;
    }
  }

  /**
   * Get a template by ID
   */
  async getTemplateById(id: string, userId: string): Promise<ITemplate | null> {
    try {
      return this.templateModel.getById(id, userId);
    } catch (error) {
      logger.error('Error getting template by ID', { error, id, userId });
      throw error;
    }
  }

  /**
   * Get templates by user ID with optional status filter
   */
  async getTemplatesByUserId(userId: string, status?: TemplateStatus): Promise<ITemplate[]> {
    try {
      return this.templateModel.getByUserId(userId, status);
    } catch (error) {
      logger.error('Error getting templates by user ID', { error, userId, status });
      throw error;
    }
  }

  /**
   * Update a template
   */
  async updateTemplate(id: string, userId: string, updates: Partial<ITemplate>): Promise<boolean> {
    try {
      // Validate template type if provided
      if (updates.type && !Object.values(TemplateType).includes(updates.type as TemplateType)) {
        throw AppError.badRequest(`Invalid template type: ${updates.type}`);
      }

      return this.templateModel.update(id, userId, updates);
    } catch (error) {
      logger.error('Error updating template', { error, id, userId, updates });
      throw error;
    }
  }

  /**
   * Delete a template
   */
  async deleteTemplate(id: string, userId: string): Promise<boolean> {
    try {
      return this.templateModel.delete(id, userId);
    } catch (error) {
      logger.error('Error deleting template', { error, id, userId });
      throw error;
    }
  }

  /**
   * Duplicate a template
   */
  async duplicateTemplate(id: string, userId: string, newName: string): Promise<ITemplate> {
    try {
      // Get the original template
      const originalTemplate = await this.getTemplateById(id, userId);

      if (!originalTemplate) {
        throw AppError.notFound(`Template with ID ${id} not found`);
      }

      // Create a new template based on the original
      const { _id, createdAt, updatedAt, ...templateData } = originalTemplate;

      return this.createTemplate({
        userId,
        name: newName,
        content: templateData.content,
        type: templateData.type,
        mediaUrl: templateData.mediaUrl,
        variables: templateData.variables,
      });
    } catch (error) {
      logger.error('Error duplicating template', { error, id, userId, newName });
      throw error;
    }
  }

  /**
   * Preview a template with variables
   */
  async previewTemplate(templateId: string, userId: string, variables: Record<string, any>): Promise<any> {
    try {
      // Get the template
      const template = await this.getTemplateById(templateId, userId);

      if (!template) {
        throw AppError.notFound(`Template with ID ${templateId} not found`);
      }

      // Process the template with variables
      return this.processTemplate(template, variables);
    } catch (error) {
      logger.error('Error previewing template', { error, templateId, userId });
      throw error;
    }
  }

  /**
   * Process a template with variables
   * Replaces {{variable}} placeholders with actual values
   */
  processTemplate(template: ITemplate, variables: Record<string, any>): any {
    let content = template.content;

    // Replace variables in the content
    if (variables && Object.keys(variables).length > 0) {
      for (const [key, value] of Object.entries(variables)) {
        const placeholder = new RegExp(`{{${key}}}`, 'g');
        content = content.replace(placeholder, value);
      }
    }

    return {
      content,
      type: template.type,
      mediaUrl: template.mediaUrl,
    };
  }
}

export const templateService = new TemplateService();