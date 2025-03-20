export interface User {
  id: string;
  name: string;
  email: string;
  companyName?: string;
  createdAt: string;
  updatedAt: string;
  settings?: UserSettings;
  role?: 'admin' | 'user';
}

export interface UserSettings {
  notifications: boolean;
  language: string;
  theme: 'light' | 'dark' | 'system';
}
