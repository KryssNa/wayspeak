'use client';

import { JSX, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import io from 'socket.io-client';
import { useAppSelector } from '@/lib/redux/hooks/hooks';

// Define types for WhatsApp connection status
interface ConnectionStatus {
  connected: boolean;
  authenticated: boolean;
}

// Define types for WhatsApp message
interface WhatsAppMessage {
  id: string;
  from: string;
  content: string;
  type: string;
  timestamp: Date;
  [key: string]: any;
}

// Define types for message status
interface MessageStatus {
  messageId: string;
  status: string;
  timestamp: Date;
}

// Socket.io client instance
let socket:any = null;

export const useWhatsAppSocket = () => {
  const { token, isAuthenticated } = useAppSelector(state => state.auth);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    authenticated: false
  });
  
  // Initialize socket connection
  useEffect(() => {
    if (!isAuthenticated || !token) return;
    
    if (!socket) {
      // Connect to socket server
      socket = io(process.env.NEXT_PUBLIC_API_URL || window.location.origin, {
        auth: { token },
        path: '/api/v1/socket.io',
        transports: ['websocket', 'polling']
      });
      
      // Connection events
      socket.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
      });
      
      socket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });
      
      // WhatsApp events
      socket.on('whatsapp:qrCode', (data: { qrCode: string }) => {
        console.log('Received QR code', data);
        setQrCode(data.qrCode);
      });
      
      socket.on('whatsapp:status', (data: ConnectionStatus) => {
        console.log('Received WhatsApp status', data);
        setConnectionStatus(prevStatus => ({
          ...prevStatus,
          authenticated: data.authenticated
        }));
      });
      
      socket.on('whatsapp:connectionStatus', (data: ConnectionStatus) => {
        console.log('Connection status changed', data);
        setConnectionStatus(data);
      });
      
      socket.on('whatsapp:authenticated', () => {
        console.log('WhatsApp authenticated');
        setConnectionStatus(prevStatus => ({
          ...prevStatus,
          authenticated: true
        }));
        setQrCode(null);
      });
      
      // Error handling
      socket.on('connect_error', (err: Error) => {
        console.error('Socket connection error:', err);
      });
    }
    
    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('whatsapp:qrCode');
        socket.off('whatsapp:status');
        socket.off('whatsapp:connectionStatus');
        socket.off('whatsapp:authenticated');
        socket.off('connect_error');
      }
    };
  }, [isAuthenticated, token]);
  
  // Request a new QR code
  const requestQR = (): void => {
    if (!socket || !isConnected) return;
    socket.emit('whatsapp:requestQR');
  };
  
  return {
    isConnected,
    qrCode,
    connectionStatus,
    requestQR
  };
};

// WhatsApp chat message hooks
export const useWhatsAppMessages = () => {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [messageStatus, setMessageStatus] = useState<Record<string, string>>({});
  
  useEffect(() => {
    if (!socket) return;
    
    // Listen for new messages
    socket.on('whatsapp:message', (message: WhatsAppMessage) => {
      console.log('New message received', message);
      setMessages(prev => [...prev, message]);
    });
    
    // Listen for status updates
    socket.on('whatsapp:status', (status: MessageStatus) => {
      console.log('Message status update', status);
      setMessageStatus(prev => ({
        ...prev,
        [status.messageId]: status.status
      }));
    });
    
    return () => {
      if (socket) {
        socket.off('whatsapp:message');
        socket.off('whatsapp:status');
      }
    };
  }, []);
  
  return {
    messages,
    messageStatus
  };
};

// WhatsApp connection status component
export function WhatsAppStatusDisplay(): JSX.Element {
  const { connectionStatus, requestQR } = useWhatsAppSocket();
  
  return (
    <div className="flex items-center space-x-2 p-2 rounded bg-gray-100 dark:bg-gray-800">
      <div 
        className={`w-3 h-3 rounded-full ${
          connectionStatus.connected ? 'bg-green-500' : 'bg-red-500'
        }`} 
      />
      <span className="text-sm">
        WhatsApp: {connectionStatus.connected ? 'Connected' : 'Disconnected'}
        {connectionStatus.connected && connectionStatus.authenticated && ' (Authenticated)'}
      </span>
      
      {connectionStatus.connected && !connectionStatus.authenticated && (
        <button 
          onClick={requestQR}
          className="text-xs bg-primary hover:bg-primary/90 text-white px-2 py-1 rounded"
        >
          Connect
        </button>
      )}
    </div>
  );
}