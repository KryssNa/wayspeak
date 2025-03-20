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

export interface Message {
  id: string;
  to: string;
  from?: string;
  content: string;
  type: MessageType;
  status: MessageStatus;
  sessionId: string;
  timestamp: string;
  mediaUrl?: string;
  metadata?: Record<string, any>;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
}

export interface SendMessagePayload {
  to: string;
  content: string;
  type: MessageType;
  mediaUrl?: string;
  sessionId?: string;
  isHighPriority?: boolean;
  metadata?: Record<string, any>;
}

export interface Conversation {
  sessionId: string;
  contact: Contact;
  lastMessage: Message;
  unreadCount: number;
}

export interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  profilePicture?: string;
  lastSeen?: string;
}
