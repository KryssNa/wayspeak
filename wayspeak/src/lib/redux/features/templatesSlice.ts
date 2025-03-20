import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as templatesApi from '@/lib/api/templates';
import { Template, CreateTemplatePayload } from '@/lib/types/templates';

interface TemplatesState {
  templates: Template[];
  selectedTemplate: Template | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: TemplatesState = {
  templates: [],
  selectedTemplate: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchTemplates = createAsyncThunk(
  'templates/fetchTemplates',
  async (_, { rejectWithValue }) => {
    try {
      return await templatesApi.getTemplates();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch templates');
    }
  }
);

export const fetchTemplateById = createAsyncThunk(
  'templates/fetchTemplateById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await templatesApi.getTemplateById(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch template');
    }
  }
);

export const createTemplate = createAsyncThunk(
  'templates/createTemplate',
  async (templateData: CreateTemplatePayload, { rejectWithValue }) => {
    try {
      return await templatesApi.createTemplate(templateData);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create template');
    }
  }
);

export const updateTemplate = createAsyncThunk(
  'templates/updateTemplate',
  async ({ id, data }: { id: string; data: CreateTemplatePayload }, { rejectWithValue }) => {
    try {
      return await templatesApi.updateTemplate(id, data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update template');
    }
  }
);

export const deleteTemplate = createAsyncThunk(
  'templates/deleteTemplate',
  async (id: string, { rejectWithValue }) => {
    try {
      await templatesApi.deleteTemplate(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete template');
    }
  }
);

const templatesSlice = createSlice({
  name: 'templates',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedTemplate: (state, action: PayloadAction<Template | null>) => {
      state.selectedTemplate = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch templates
    builder.addCase(fetchTemplates.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchTemplates.fulfilled, (state, action: PayloadAction<Template[]>) => {
      state.isLoading = false;
      state.templates = action.payload;
    });
    builder.addCase(fetchTemplates.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // Fetch template by ID
    builder.addCase(fetchTemplateById.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchTemplateById.fulfilled, (state, action: PayloadAction<Template>) => {
      state.isLoading = false;
      state.selectedTemplate = action.payload;
    });
    builder.addCase(fetchTemplateById.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // Create template
    builder.addCase(createTemplate.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(createTemplate.fulfilled, (state, action: PayloadAction<Template>) => {
      state.isLoading = false;
      state.templates = [action.payload, ...state.templates];
      state.selectedTemplate = action.payload;
    });
    builder.addCase(createTemplate.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // Update template
    builder.addCase(updateTemplate.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(updateTemplate.fulfilled, (state, action: PayloadAction<Template>) => {
      state.isLoading = false;
      state.templates = state.templates.map(template =>
        template.id === action.payload.id ? action.payload : template
      );
      state.selectedTemplate = action.payload;
    });
    builder.addCase(updateTemplate.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // Delete template
    builder.addCase(deleteTemplate.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(deleteTemplate.fulfilled, (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.templates = state.templates.filter(template => template.id !== action.payload);
      if (state.selectedTemplate && state.selectedTemplate.id === action.payload) {
        state.selectedTemplate = null;
      }
    });
    builder.addCase(deleteTemplate.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearError, setSelectedTemplate } = templatesSlice.actions;
export default templatesSlice.reducer;
