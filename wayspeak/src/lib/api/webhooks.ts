import { apiRequest } from './client';
import { Webhook, CreateWebhookPayload } from '@/lib/types/webhooks';

export const getWebhooks = async (): Promise<Webhook[]> => {
  return await apiRequest<Webhook[]>('GET', '/webhooks');
};

export const getWebhookById = async (id: string): Promise<Webhook> => {
  return await apiRequest<Webhook>('GET', `/webhooks/${id}`);
};

export const createWebhook = async (data: CreateWebhookPayload): Promise<Webhook> => {
  return await apiRequest<Webhook>('POST', '/webhooks', data);
};

export const updateWebhook = async (id: string, data: Partial<CreateWebhookPayload>): Promise<Webhook> => {
  return await apiRequest<Webhook>('PUT', `/webhooks/${id}`, data);
};

export const deleteWebhook = async (id: string): Promise<void> => {
  return await apiRequest<void>('DELETE', `/webhooks/${id}`);
};
