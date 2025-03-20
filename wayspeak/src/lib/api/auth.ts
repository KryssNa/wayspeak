import { apiRequest } from './client';
import { User } from '@/lib/types/user';

interface LoginResponse {
  token: string;
  user: User;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  companyName?: string;
}

interface LoginData {
  email: string;
  password: string;
}

export const login = async (data: LoginData): Promise<LoginResponse> => {
  return await apiRequest<LoginResponse>('POST', '/auth/login', data);
};

export const register = async (data: RegisterData): Promise<LoginResponse> => {
  return await apiRequest<LoginResponse>('POST', '/auth/register', data);
};

export const logout = async (): Promise<void> => {
  return await apiRequest<void>('POST', '/auth/logout');
};

export const getUser = async (): Promise<User> => {
  return await apiRequest<User>('GET', '/auth/me');
};

export const resetPassword = async (email: string): Promise<void> => {
  return await apiRequest<void>('POST', '/auth/reset-password', { email });
};

export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  return await apiRequest<void>('POST', '/auth/change-password', {
    currentPassword,
    newPassword,
  });
};
