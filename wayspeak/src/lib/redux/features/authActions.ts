// authActions.ts - Separate file for auth actions
import { createAction } from '@reduxjs/toolkit';
import { User } from '@/lib/types/user';

// Create actions outside of the slice
export const logoutAction = createAction('auth/logout');
export const loginSuccess = createAction<{ token: string; user: User }>('auth/loginSuccess');
export const registerSuccess = createAction<{ token: string; user: User }>('auth/registerSuccess');
export const setUserProfile = createAction<User>('auth/setUserProfile');
export const setAuthError = createAction<string>('auth/setError');
export const clearAuthError = createAction('auth/clearError');