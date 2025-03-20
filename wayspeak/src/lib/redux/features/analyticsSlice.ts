import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as analyticsApi from '@/lib/api/analytics';
import { AnalyticsData, DateRange, DeliveryStats, EngagementMetrics } from '@/lib/types/analytics';

interface AnalyticsState {
  messageAnalytics: AnalyticsData | null;
  engagementAnalytics: AnalyticsData | null;
  deliveryStats: DeliveryStats | null;
  selectedDateRange: DateRange;
  isLoading: boolean;
  error: string | null;
}

const initialState: AnalyticsState = {
  messageAnalytics: null,
  engagementAnalytics: null,
  deliveryStats: null,
  selectedDateRange: 'week',
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchMessageAnalytics = createAsyncThunk(
  'analytics/fetchMessageAnalytics',
  async (dateRange: DateRange, { rejectWithValue }) => {
    try {
      return await analyticsApi.getMessageAnalytics(dateRange);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch message analytics');
    }
  }
);

export const fetchEngagementAnalytics = createAsyncThunk(
  'analytics/fetchEngagementAnalytics',
  async (dateRange: DateRange, { rejectWithValue }) => {
    try {
      return await analyticsApi.getEngagementAnalytics(dateRange);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch engagement analytics');
    }
  }
);

export const fetchDeliveryStats = createAsyncThunk(
  'analytics/fetchDeliveryStats',
  async (_, { rejectWithValue }) => {
    try {
      return await analyticsApi.getDeliveryStats();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch delivery stats');
    }
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setDateRange: (state, action: PayloadAction<DateRange>) => {
      state.selectedDateRange = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch message analytics
    builder.addCase(fetchMessageAnalytics.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchMessageAnalytics.fulfilled, (state, action: PayloadAction<AnalyticsData>) => {
      state.isLoading = false;
      state.messageAnalytics = action.payload;
    });
    builder.addCase(fetchMessageAnalytics.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // Fetch engagement analytics
    builder.addCase(fetchEngagementAnalytics.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchEngagementAnalytics.fulfilled, (state, action: PayloadAction<AnalyticsData>) => {
      state.isLoading = false;
      state.engagementAnalytics = action.payload;
    });
    builder.addCase(fetchEngagementAnalytics.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // Fetch delivery stats
    builder.addCase(fetchDeliveryStats.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchDeliveryStats.fulfilled, (state, action) => {
      state.isLoading = false;
      state.deliveryStats = action.payload;
    });
    builder.addCase(fetchDeliveryStats.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearError, setDateRange } = analyticsSlice.actions;
export default analyticsSlice.reducer;
