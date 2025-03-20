export interface Webhook {
  id: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  lastTriggeredAt?: string;
}

export type WebhookEvent = 
  | 'message.received'
  | 'message.sent'
  | 'message.delivered'
  | 'message.read'
  | 'message.failed';

export interface CreateWebhookPayload {
  url: string;
  events: WebhookEvent[];
  description?: string;
}
