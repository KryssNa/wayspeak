// src/core/models/webhook.model.ts
import { ObjectId } from 'mongodb';
import databaseService from '../../config/database';

export enum WebhookStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export type WebhookEvent = 
  | 'message.received'
  | 'message.sent'
  | 'message.delivered'
  | 'message.read'
  | 'message.failed';

export interface IWebhook {
  _id?: ObjectId;
  userId: ObjectId;
  url: string;
  events: WebhookEvent[];
  description?: string;
  status: WebhookStatus;
  secret?: string;
  createdAt: Date;
  updatedAt: Date;
  lastTriggeredAt?: Date;
  failCount?: number;
}

export class WebhookModel {
  private collection = 'webhooks';

  /**
   * Create a new webhook
   */
  async create(webhook: Omit<IWebhook, '_id' | 'createdAt' | 'updatedAt'>): Promise<IWebhook> {
    const db = databaseService.getDb();
    
    const now = new Date();
    const newWebhook: IWebhook = {
      ...webhook,
      status: webhook.status || WebhookStatus.ACTIVE,
      failCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    
    const result = await db.collection(this.collection).insertOne(newWebhook);
    
    return {
      ...newWebhook,
      _id: result.insertedId,
    };
  }

  /**
   * Get a webhook by ID
   */
  async getById(id: string, userId: string): Promise<IWebhook | null> {
    const db = databaseService.getDb();
    
    return db.collection(this.collection).findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(userId),
    }) as Promise<IWebhook | null>;
  }

  /**
   * Get webhooks by user ID
   */
  async getByUserId(userId: string): Promise<IWebhook[]> {
    const db = databaseService.getDb();
    
    return db.collection(this.collection)
      .find({
        userId: new ObjectId(userId),
      })
      .sort({ createdAt: -1 })
      .toArray() as Promise<IWebhook[]>;
  }

  /**
   * Get webhooks by event type
   */
  async getByEvent(event: WebhookEvent): Promise<IWebhook[]> {
    const db = databaseService.getDb();
    
    return db.collection(this.collection)
      .find({
        events: event,
        status: WebhookStatus.ACTIVE,
      })
      .toArray() as Promise<IWebhook[]>;
  }

  /**
   * Update a webhook
   */
  async update(id: string, userId: string, updates: Partial<IWebhook>): Promise<boolean> {
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
   * Update last triggered time
   */
  async updateLastTriggered(id: string): Promise<boolean> {
    const db = databaseService.getDb();
    
    const result = await db.collection(this.collection).updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: {
          lastTriggeredAt: new Date(),
          updatedAt: new Date(),
        }
      }
    );
    
    return result.modifiedCount > 0;
  }

  /**
   * Increment fail count
   */
  async incrementFailCount(id: string): Promise<boolean> {
    const db = databaseService.getDb();
    
    const result = await db.collection(this.collection).updateOne(
      { _id: new ObjectId(id) },
      { 
        $inc: { failCount: 1 },
        $set: { updatedAt: new Date() },
      }
    );
    
    return result.modifiedCount > 0;
  }

  /**
   * Reset fail count
   */
  async resetFailCount(id: string): Promise<boolean> {
    const db = databaseService.getDb();
    
    const result = await db.collection(this.collection).updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: {
          failCount: 0,
          updatedAt: new Date(),
        }
      }
    );
    
    return result.modifiedCount > 0;
  }

  /**
   * Delete a webhook
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