import axios, { AxiosInstance, AxiosResponse } from 'axios';
import config from '../../config';
import logger from '../../utils/logging/logger';
import { AppError } from '../../utils/errors/app-error';

// Message types
export type MessageType = 'text' | 'image' | 'audio' | 'video' | 'document' | 'location' | 'contact';

// Send message options
export interface SendMessageOptions {
  to: string;
  type: MessageType;
  content: string;
  mediaUrl?: string;
}

export class WhatsAppClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.whatsapp.apiUrl,
      headers: {
        'Authorization': `Bearer ${config.whatsapp.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async sendMessage(options: SendMessageOptions): Promise<any> {
    try {
      const payload = this.buildMessagePayload(options);
      const response = await this.client.post('/messages', payload);
      return response.data;
    } catch (error) {
      logger.error('WhatsApp API error', { error, options });
      
      if (axios.isAxiosError(error) && error.response) {
        throw new AppError(
          error.response.status,
          error.response.data?.message || 'WhatsApp API error',
          true,
          error.response.data
        );
      }
      
      throw new AppError(500, 'Failed to send WhatsApp message', true);
    }
  }

  async getMessageStatus(messageId: string): Promise<any> {
    try {
      const response = await this.client.get(`/messages/${messageId}`);
      return response.data;
    } catch (error) {
      logger.error('Failed to get message status', { error, messageId });
      throw new AppError(500, 'Failed to get message status', true);
    }
  }

  private buildMessagePayload(options: SendMessageOptions): any {
    const payload: any = {
      to: options.to,
      type: options.type,
      recipient_type: 'individual',
    };
    
    // Add content based on message type
    switch (options.type) {
      case 'text':
        payload.text = { body: options.content };
        break;
      case 'image':
        payload.image = { 
          link: options.mediaUrl,
          caption: options.content 
        };
        break;
      case 'audio':
        payload.audio = { link: options.mediaUrl };
        break;
      case 'video':
        payload.video = { 
          link: options.mediaUrl,
          caption: options.content 
        };
        break;
      case 'document':
        payload.document = { 
          link: options.mediaUrl,
          caption: options.content 
        };
        break;
      case 'location':
        // Parse content as "latitude,longitude"
        const [latitude, longitude] = options.content.split(',').map(Number);
        payload.location = { latitude, longitude };
        break;
      default:
        throw new AppError(400, `Unsupported message type: ${options.type}`, true);
    }
    
    return payload;
  }
}

// Create singleton instance
export const whatsappClient = new WhatsAppClient();
