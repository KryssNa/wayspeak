import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/authSlice';
import messagesReducer from './features/messagesSlice';
import templatesReducer from './features/templatesSlice';
import analyticsReducer from './features/analyticsSlice';
import webhooksReducer from './features/webhooksSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    messages: messagesReducer,
    templates: templatesReducer,
    analytics: analyticsReducer,
    webhooks: webhooksReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
