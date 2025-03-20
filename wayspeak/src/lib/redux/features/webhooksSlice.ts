import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as webhooksApi from '@/lib/api/webhooks';
import { Webhook, CreateWebhookPayload } from '@/lib/types/webhooks';

interface WebhooksState {
  webhooks: Webhook[];
  selectedWebhook: Webhook | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: WebhooksState = {
  webhooks: [],
  selectedWebhook: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchWebhooks = createAsyncThunk(
  'webhooks/fetchWebhooks',
  async (_, { rejectWithValue }) => {
    try {
      return await webhooksApi.getWebhooks();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch webhooks');
    }
  }
);

export const fetchWebhookById = createAsyncThunk(
  'webhooks/fetchWebhookById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await webhooksApi.getWebhookById(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch webhook');
    }
  }
);

export const createWebhook = createAsyncThunk(
  'webhooks/createWebhook',
  async (webhookData: CreateWebhookPayload, { rejectWithValue }) => {
    try {
      return await webhooksApi.createWebhook(webhookData);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create webhook');
    }
  }
);

export const updateWebhook = createAsyncThunk(
  'webhooks/updateWebhook',
  async ({ id, data }: { id: string; data: Partial<CreateWebhookPayload> }, { rejectWithValue }) => {
    try {
      return await webhooksApi.updateWebhook(id, data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update webhook');
    }
  }
);

export const deleteWebhook = createAsyncThunk(
  'webhooks/deleteWebhook',
  async (id: string, { rejectWithValue }) => {
    try {
      await webhooksApi.deleteWebhook(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete webhook');
    }
  }
);

const webhooksSlice = createSlice({
  name: 'webhooks',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedWebhook: (state, action: PayloadAction<Webhook | null>) => {
      state.selectedWebhook = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch webhooks
    builder.addCase(fetchWebhooks.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchWebhooks.fulfilled, (state, action: PayloadAction<Webhook[]>) => {
      state.isLoading = false;
      state.webhooks = action.payload;
    });
    builder.addCase(fetchWebhooks.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // Fetch webhook by ID
    builder.addCase(fetchWebhookById.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchWebhookById.fulfilled, (state, action: PayloadAction<Webhook>) => {
      state.isLoading = false;
      state.selectedWebhook = action.payload;
    });
    builder.addCase(fetchWebhookById.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // Create webhook
    builder.addCase(createWebhook.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(createWebhook.fulfilled, (state, action: PayloadAction<Webhook>) => {
      state.isLoading = false;
      state.webhooks = [action.payload, ...state.webhooks];
      state.selectedWebhook = action.payload;
    });
    builder.addCase(createWebhook.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // Update webhook
    builder.addCase(updateWebhook.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(updateWebhook.fulfilled, (state, action: PayloadAction<Webhook>) => {
      state.isLoading = false;
      state.webhooks = state.webhooks.map(webhook =>
        webhook.id === action.payload.id ? action.payload : webhook
      );
      state.selectedWebhook = action.payload;
    });
    builder.addCase(updateWebhook.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // Delete webhook
    builder.addCase(deleteWebhook.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(deleteWebhook.fulfilled, (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.webhooks = state.webhooks.filter(webhook => webhook.id !== action.payload);
      if (state.selectedWebhook && state.selectedWebhook.id === action.payload) {
        state.selectedWebhook = null;
      }
    });
    builder.addCase(deleteWebhook.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearError, setSelectedWebhook } = webhooksSlice.actions;
export default webhooksSlice.reducer;
