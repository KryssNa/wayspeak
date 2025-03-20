// src/core/models/message.model.ts
import { ObjectId } from 'mongodb';
import databaseService from '../../config/database';

export enum MessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  DOCUMENT = 'document',
  LOCATION = 'location',
  CONTACT = 'contact',
  TEMPLATE = 'template',
}

export interface IMessage {
  _id?: ObjectId;
  userId: ObjectId;
  to: string;
  from?: string;
  content: string;
  type: MessageType;
  status: MessageStatus;
  mediaUrl?: string;
  sessionId?: string;
  isHighPriority?: boolean;
  metadata?: Record<string, any>;
  providerMessageId?: string;
  templateId?: string;
  templateData?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failedAt?: Date;
  failureReason?: string;
}

export class MessageModel {
  private collection = 'messages';

  /**
   * Create a new message
   */
  async create(message: Omit<IMessage, '_id' | 'createdAt' | 'updatedAt'>): Promise<IMessage> {
    const db = databaseService.getDb();
    
    const now = new Date();
    const newMessage: IMessage = {
      ...message,
      status: message.status || MessageStatus.PENDING,
      createdAt: now,
      updatedAt: now,
    };
    
    const result = await db.collection(this.collection).insertOne(newMessage);
    
    return {
      ...newMessage,
      _id: result.insertedId,
    };
  }

  /**
   * Get a message by ID
   */
  async getById(id: string, userId: string): Promise<IMessage | null> {
    const db = databaseService.getDb();
    
    return db.collection(this.collection).findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(userId),
    }) as Promise<IMessage | null>;
  }

  /**
   * Get messages by session ID
   */
  async getBySessionId(sessionId: string, userId: string, limit = 50): Promise<IMessage[]> {
    const db = databaseService.getDb();
    
    return db.collection(this.collection)
      .find({
        sessionId,
        userId: new ObjectId(userId),
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray() as Promise<IMessage[]>;
  }

  /**
   * Get unread messages by session ID
   */
  async getUnreadBySessionId(sessionId: string, userId: string): Promise<IMessage[]> {
    const db = databaseService.getDb();
    
    return db.collection(this.collection)
      .find({
        sessionId,
        userId: new ObjectId(userId),
        status: { $in: [MessageStatus.DELIVERED, MessageStatus.SENT] },
      })
      .toArray() as Promise<IMessage[]>;
  }

  /**
   * Get messages by user ID with pagination
   */
  async getByUserId(userId: string, { limit = 50, offset = 0 }): Promise<IMessage[]> {
    const db = databaseService.getDb();
    
    return db.collection(this.collection)
      .find({
        userId: new ObjectId(userId),
      })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray() as Promise<IMessage[]>;
  }

  /**
   * Update message status
   */
  async updateStatus(id: string, status: MessageStatus): Promise<boolean> {
    const db = databaseService.getDb();
    
    const now = new Date();
    const statusTimestamp = this.getStatusTimestampField(status);
    
    const updateFields: any = {
      status,
      updatedAt: now,
    };
    
    if (statusTimestamp) {
      updateFields[statusTimestamp] = now;
    }
    
    const result = await db.collection(this.collection).updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );
    
    return result.modifiedCount > 0;
  }

  /**
   * Get all unique sessions for a user
   */
  async getSessions(userId: string): Promise<any[]> {
    const db = databaseService.getDb();
    
    const pipeline = [
      {
        $match: {
          userId: new ObjectId(userId),
          sessionId: { $exists: true, $ne: null },
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $group: {
          _id: '$sessionId',
          lastMessage: { $first: '$$ROOT' },
          count: { $sum: 1 },
          unreadCount: {
            $sum: {
              $cond: [
                { $in: ['$status', [MessageStatus.DELIVERED, MessageStatus.SENT]] },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          sessionId: '$_id',
          lastMessage: 1,
          messageCount: '$count',
          unreadCount: 1,
        },
      },
      {
        $sort: {
          'lastMessage.createdAt': -1,
        },
      },
    ];
    
    return db.collection(this.collection).aggregate(pipeline).toArray();
  }

  /**
   * Get the corresponding timestamp field for a status
   */
  private getStatusTimestampField(status: MessageStatus): string | null {
    const statusTimestamps: { [key in MessageStatus]: string | null } = {
      [MessageStatus.PENDING]: null,
      [MessageStatus.SENT]: 'sentAt',
      [MessageStatus.DELIVERED]: 'deliveredAt',
      [MessageStatus.READ]: 'readAt',
      [MessageStatus.FAILED]: 'failedAt',
    };
    
    return statusTimestamps[status] || null;
  }
}

// Don't immediately instantiate - this will be handled by the service layer
// export const messageModel = new MessageModel();