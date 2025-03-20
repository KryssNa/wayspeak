import { apiRequest } from './client';
import { Message, SendMessagePayload } from '@/lib/types/messages';

export const getMessages = async (limit: number = 50, offset: number = 0): Promise<Message[]> => {
  const response= await apiRequest<{messages:Message[]}>('GET', '/messages', undefined, {
    params: { limit, offset },
  }); 
  return response.messages;
};

export const getMessageById = async (id: string): Promise<Message> => {
  const response= await apiRequest<{messages:Message}>('GET', `/messages/${id}`);
  return response.messages;
};

export const getConversation = async (sessionId: string, limit: number = 50): Promise<Message[]> => {
  const response= await apiRequest<{messages:Message[]}>('GET', `/messages/${sessionId}`, undefined, {
    params: { limit },
  });
  return response.messages;
};

export const sendMessage = async (data: SendMessagePayload): Promise<Message> => {
  const response= await apiRequest<{messages:Message}>('POST', '/messages', data);
  return response.messages;
};

export const deleteMessage = async (id: string): Promise<void> => {
  return await apiRequest<void>('DELETE', `/messages/${id}`);
};
