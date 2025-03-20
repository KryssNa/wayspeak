import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as messagesApi from '@/lib/api/messages';
import { Message, MessageStatus, SendMessagePayload, Conversation } from '@/lib/types/messages';

interface MessagesState {
  messages: Message[];
  conversations: Record<string, Message[]>;
  activeConversation: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: MessagesState = {
  messages: [],
  conversations: {},
  activeConversation: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchMessages = createAsyncThunk(
  'messages/fetchMessages',
  async ({ limit, offset }: { limit?: number; offset?: number } = {}, { rejectWithValue }) => {
    try {
      return await messagesApi.getMessages(limit, offset);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch messages');
    }
  }
);

export const fetchConversation = createAsyncThunk(
  'messages/fetchConversation',
  async ({ sessionId, limit }: { sessionId: string; limit?: number }, { rejectWithValue }) => {
    try {
      const messages = await messagesApi.getConversation(sessionId, limit);
      return { sessionId, messages };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch conversation');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async (messageData: SendMessagePayload, { rejectWithValue }) => {
    try {
      return await messagesApi.sendMessage(messageData);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to send message');
    }
  }
);

export const deleteMessage = createAsyncThunk(
  'messages/deleteMessage',
  async (id: string, { rejectWithValue }) => {
    try {
      await messagesApi.deleteMessage(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete message');
    }
  }
);

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setActiveConversation: (state, action: PayloadAction<string | null>) => {
      state.activeConversation = action.payload;
    },
    updateMessageStatus: (state, action: PayloadAction<{ id: string; status: MessageStatus }>) => {
      const { id, status } = action.payload;
      const message = state.messages.find(msg => msg.id === id);
      
      if (message) {
        message.status = status;
      }
      
      // Also update in conversations
      for (const sessionId in state.conversations) {
        const idx = state.conversations[sessionId].findIndex(msg => msg.id === id);
        if (idx !== -1) {
          state.conversations[sessionId][idx].status = status;
        }
      }
    },
    // For real-time message receipt
    addIncomingMessage: (state, action: PayloadAction<Message>) => {
      const message = action.payload;
      state.messages.unshift(message);
      
      // Add to conversation if exists
      if (state.conversations[message.sessionId]) {
        state.conversations[message.sessionId].unshift(message);
      } else {
        state.conversations[message.sessionId] = [message];
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch messages
    builder.addCase(fetchMessages.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchMessages.fulfilled, (state, action: PayloadAction<Message[]>) => {
      state.isLoading = false;
      state.messages = action.payload;
    });
    builder.addCase(fetchMessages.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // Fetch conversation
    builder.addCase(fetchConversation.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchConversation.fulfilled, (state, action: PayloadAction<{ sessionId: string; messages: Message[] }>) => {
      state.isLoading = false;
      const { sessionId, messages } = action.payload;
      state.conversations[sessionId] = messages;
    });
    builder.addCase(fetchConversation.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // Send message
    builder.addCase(sendMessage.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(sendMessage.fulfilled, (state, action: PayloadAction<Message>) => {
      state.isLoading = false;
      if (action.payload) {
        state.messages = [action.payload, ...state.messages];
        
        // Add to conversation if exists
        const { sessionId } = action.payload;
        if (state.conversations[sessionId]) {
          state.conversations[sessionId] = [action.payload, ...state.conversations[sessionId]];
        } else {
          state.conversations[sessionId] = [action.payload];
        }
      }
    });
    builder.addCase(sendMessage.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // Delete message
    builder.addCase(deleteMessage.fulfilled, (state, action: PayloadAction<string>) => {
      const id = action.payload;
      state.messages = state.messages.filter(message => message.id !== id);
      
      // Also remove from conversations
      for (const sessionId in state.conversations) {
        state.conversations[sessionId] = state.conversations[sessionId].filter(
          message => message.id !== id
        );
      }
    });
  },
});

export const { 
  clearError, 
  setActiveConversation, 
  updateMessageStatus,
  addIncomingMessage
} = messagesSlice.actions;
export default messagesSlice.reducer;
