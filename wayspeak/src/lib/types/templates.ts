export interface Template {
  id: string;
  name: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'document';
  mediaUrl?: string;
  variables: TemplateVariable[];
  status: 'draft' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  
}

export interface TemplateVariable {
  name: string;
  description: string;
  required: boolean;
}

export interface CreateTemplatePayload {
  name: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'document';
  mediaUrl?: string;
  variables: TemplateVariable[];
}
