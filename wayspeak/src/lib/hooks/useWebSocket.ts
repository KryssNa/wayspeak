'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppDispatch } from '@/lib/redux/hooks/hooks';
import { addIncomingMessage, updateMessageStatus } from '@/lib/redux/features/messagesSlice';
import { Message, MessageStatus } from '@/lib/types/messages';

type WebSocketStatus = 'connecting' | 'connected' | 'disconnected';

export const useWebSocket = (url: string) => {
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const dispatch = useAppDispatch();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        setStatus('connected');
        setError(null);
        console.log('WebSocket connected');
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };
      
      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('Connection error occurred');
      };
      
      ws.onclose = () => {
        setStatus('disconnected');
        console.log('WebSocket disconnected');
        
        // Set up reconnection
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect WebSocket...');
          connect();
        }, 3000); // Reconnect after 3 seconds
      };
      
      wsRef.current = ws;
    } catch (err) {
      console.error('Error creating WebSocket:', err);
      setError('Failed to create WebSocket connection');
    }
  }, [url]);
  
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setStatus('disconnected');
  }, []);
  
  const handleWebSocketMessage = (data: any) => {
    if (data.type === 'MESSAGE_RECEIVED') {
      // Handle incoming message
      const message: Message = data.payload;
      dispatch(addIncomingMessage(message));
    } else if (data.type === 'MESSAGE_STATUS_UPDATED') {
      // Handle message status update
      const { id, status } = data.payload;
      dispatch(updateMessageStatus({ id, status: status as MessageStatus }));
    }
  };
  
  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      setError('WebSocket is not connected');
    }
  }, []);
  
  useEffect(() => {
    // Connect to WebSocket when component mounts
    connect();
    
    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);
  
  return { status, error, sendMessage };
};
