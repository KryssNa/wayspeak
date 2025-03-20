import axios, { AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { store } from '@/lib/redux/store';
import { logoutAction } from '@/lib/redux/features/authActions';

// Base API URL from environment
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5500/api/v1';

console.log('baseURL:', baseURL);
// Create axios instance
export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding token
apiClient.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.token;
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling token expiration
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // If unauthorized error and not already retrying
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try refreshing token
        const refreshResponse = await apiClient.post('/auth/refresh-token');
        const newToken = refreshResponse.data.token;
        
        localStorage.setItem('token', newToken);
        
        // Update auth header and retry
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        
        return apiClient(originalRequest);
      } catch (refreshError) {
        // If refresh fails, log the user out
        store.dispatch(logoutAction());
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// API response interface
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  error?: {
    type: string;
    message: string;
    details?: any;
  };
}

// Generic API request function with error handling
export const apiRequest = async <T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    let response;
    
    switch (method) {
      case 'GET':
        response = await apiClient.get<ApiResponse<T>>(url, config);
        break;
      case 'POST':
        response = await apiClient.post<ApiResponse<T>>(url, data, config);
        break;
      case 'PUT':
        response = await apiClient.put<ApiResponse<T>>(url, data, config);
        break;
      case 'DELETE':
        response = await apiClient.delete<ApiResponse<T>>(url, config);
        break;
    }
    
    return response.data.data;
  } catch (error: any) {
    // Extract error message from response
    const errorMessage = error.response?.data?.error?.message || 'An unexpected error occurred';
    
    // Create an enhanced error with additional information
    const enhancedError = new Error(errorMessage);
    enhancedError.name = error.response?.data?.error?.type || 'API_ERROR';
    
    // Add response details to error
    (enhancedError as any).details = error.response?.data?.error?.details;
    (enhancedError as any).status = error.response?.status;
    
    throw enhancedError;
  }
};