import * as authApi from '@/lib/api/auth';
import { User } from '@/lib/types/user';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  clearAuthError,
  loginSuccess,
  logoutAction,
  registerSuccess,
  setAuthError,
  setUserProfile
} from './authActions';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { dispatch, rejectWithValue }) => {
    try {
      const response = await authApi.login({ email, password });
      const { token, user } = response;

      // Save token to localStorage
      localStorage.setItem('token', token);

      // Dispatch success action instead of returning data
      dispatch(loginSuccess({ token, user }));
      return null;
    } catch (error: any) {
      dispatch(setAuthError(error.message || 'Login failed'));
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: { name: string; email: string; password: string; companyName?: string }, { dispatch, rejectWithValue }) => {
    try {
      const response = await authApi.register(userData);
      const { token, user } = response;

      // Save token to localStorage
      localStorage.setItem('token', token);

      // Dispatch success action instead of returning data
      dispatch(registerSuccess({ token, user }));
      return null;
    } catch (error: any) {
      dispatch(setAuthError(error.message || 'Registration failed'));
      return rejectWithValue(error.message || 'Registration failed');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      await authApi.logout();
      // Remove token from localStorage
      localStorage.removeItem('token');
      dispatch(logoutAction());
      return null;
    } catch (error: any) {
      // Still remove token and log out even if API call fails
      localStorage.removeItem('token');
      dispatch(logoutAction());
      return rejectWithValue(error.message);
    }
  }
);

export const getUserProfile = createAsyncThunk(
  'auth/getUserProfile',
  async (_, { dispatch, rejectWithValue, getState }) => {
    try {
      const { auth } = getState() as { auth: AuthState };

      if (!auth.token) {
        throw new Error('No token available');
      }

      const user = await authApi.getUser();
      dispatch(setUserProfile(user));
      return null;
    } catch (error: any) {
      dispatch(setAuthError(error.message || 'Failed to fetch user profile'));
      return rejectWithValue(error.message || 'Failed to fetch user profile');
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken: (state, action) => {
      state.token = action.payload;
      localStorage.setItem('token', action.payload);
    },
  },
  extraReducers: (builder) => {
    // Handle the actions defined outside the slice
    builder
      // Login Status Management
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(login.rejected, (state) => {
        state.isLoading = false;
      })

      // Register Status Management
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(register.rejected, (state) => {
        state.isLoading = false;
      })

      // Get Profile Status Management
      .addCase(getUserProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getUserProfile.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(getUserProfile.rejected, (state) => {
        state.isLoading = false;
      })

      // Auth Action Handlers
      .addCase(loginSuccess, (state, action) => {
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(registerSuccess, (state, action) => {
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(logoutAction, (state) => {
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
      })
      .addCase(setUserProfile, (state, action) => {
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(setAuthError, (state, action) => {
        state.error = action.payload;
      })
      .addCase(clearAuthError, (state) => {
        state.error = null;
      });
  },
});

export const { setToken } = authSlice.actions;

// Re-export the action for client.js to use
export { logoutAction } from './authActions';

export default authSlice.reducer;