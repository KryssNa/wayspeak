// src/core/models/template.model.ts
import { ObjectId } from 'mongodb';
import databaseService from '../../config/database';

export enum TemplateStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING_APPROVAL = 'pending_approval',
  REJECTED = 'rejected',
}

export enum TemplateType {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  DOCUMENT = 'document',
}

export interface ITemplate {
  _id?: ObjectId;
  userId: ObjectId;
  name: string;
  content: string;
  type: TemplateType;
  mediaUrl?: string;
  variables?: string[];
  status: TemplateStatus;
  providerTemplateId?: string;
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
}

export class TemplateModel {
  private collection = 'templates';

  /**
   * Create a new template
   */
  async create(template: Omit<ITemplate, '_id' | 'createdAt' | 'updatedAt'>): Promise<ITemplate> {
    const db = databaseService.getDb();
    
    const now = new Date();
    const newTemplate: ITemplate = {
      ...template,
      status: template.status || TemplateStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    };
    
    const result = await db.collection(this.collection).insertOne(newTemplate);
    
    return {
      ...newTemplate,
      _id: result.insertedId,
    };
  }

  /**
   * Get a template by ID
   */
  async getById(id: string, userId: string): Promise<ITemplate | null> {
    const db = databaseService.getDb();
    
    return db.collection(this.collection).findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(userId),
    }) as Promise<ITemplate | null>;
  }

  /**
   * Get templates by user ID with optional status filter
   */
  async getByUserId(userId: string, status?: TemplateStatus): Promise<ITemplate[]> {
    const db = databaseService.getDb();
    
    const query: any = {
      userId: new ObjectId(userId),
    };
    
    if (status) {
      query.status = status;
    }
    
    return db.collection(this.collection)
      .find(query)
      .sort({ updatedAt: -1 })
      .toArray() as Promise<ITemplate[]>;
  }

  /**
   * Update a template
   */
  async update(id: string, userId: string, updates: Partial<ITemplate>): Promise<boolean> {
    const db = databaseService.getDb();
    
    // Don't allow updating these fields directly
    const { _id, userId: updatedUserId, createdAt, ...validUpdates } = updates as any;
    
    validUpdates.updatedAt = new Date();
    
    const result = await db.collection(this.collection).updateOne(
      { 
        _id: new ObjectId(id),
        userId: new ObjectId(userId),
      },
      { $set: validUpdates }
    );
    
    return result.modifiedCount > 0;
  }

  /**
   * Delete a template
   */
  async delete(id: string, userId: string): Promise<boolean> {
    const db = databaseService.getDb();
    
    const result = await db.collection(this.collection).deleteOne({
      _id: new ObjectId(id),
      userId: new ObjectId(userId),
    });
    
    return result.deletedCount > 0;
  }
}