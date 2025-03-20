import { apiRequest } from './client';
import { Template, CreateTemplatePayload } from '@/lib/types/templates';

export const getTemplates = async (): Promise<Template[]> => {
  const response = await apiRequest<{ templates: Template[] }>('GET', '/templates');
  return response.templates;
};

export const getTemplateById = async (id: string): Promise<Template> => {
  return await apiRequest<Template>('GET', `/templates/${id}`);
};

export const createTemplate = async (data: CreateTemplatePayload): Promise<Template> => {
  const response= await apiRequest<{ templates: Template }>('POST', '/templates', data);
  return response.templates;
};

export const updateTemplate = async (id: string, data: CreateTemplatePayload): Promise<Template> => {
  const response= await apiRequest<{ templates: Template }>('PUT', `/templates/${id}`, data);
  return response.templates;
};

export const deleteTemplate = async (id: string): Promise<void> => {
  return await apiRequest<void>('DELETE', `/templates/${id}`);
};
