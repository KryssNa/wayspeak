// src/sockets/index.ts

import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from '../config';
import logger from '../utils/logging/logger';
import { userService } from '../core/services/user.service';

// Export io instance to be used throughout the app
export let io: SocketServer;

// Socket events enum
export enum SocketEvents {
  MESSAGE_RECEIVED = 'message:received',
  MESSAGE_SENT = 'message:sent',
  MESSAGE_DELIVERED = 'message:delivered',
  MESSAGE_READ = 'message:read',
  MESSAGE_FAILED = 'message:failed',
  MESSAGE_STATUS_UPDATE = 'message:status_update',
  SESSION_UPDATED = 'session:updated',
  USER_TYPING = 'user:typing',
  USER_ONLINE = 'user:online',
  USER_OFFLINE = 'user:offline'
}

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export function setupSocketHandlers(socketServer: SocketServer): SocketServer {
  // Save the io instance
  io = socketServer;

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      // Get token from handshake auth or headers
      const token = socket.handshake.auth.token || 
                    socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication required'));
      }

      try {
        // Verify token
        const decoded = jwt.verify(token, config.jwt.secret) as { id: string };
        
        // Check if user exists
        const user = await userService.getUserById(decoded.id);
        if (!user) {
          return next(new Error('User not found'));
        }
        
        // Store user ID in socket data
        socket.userId = decoded.id;
        next();
      } catch (error) {
        next(new Error('Invalid token'));
      }
    } catch (error) {
      logger.error('Socket authentication error', { error });
      next(new Error('Authentication error'));
    }
  });

  // Connection handler
  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId;
    logger.info(`User connected to WebSocket: ${userId}`);

    // Join user-specific room for targeted events
    socket.join(`user:${userId}`);

    // Emit user online status
    io.emit(SocketEvents.USER_ONLINE, { userId });

    // Handle typing events
    socket.on(SocketEvents.USER_TYPING, (data: { sessionId: string }) => {
      const { sessionId } = data;
      socket.to(`session:${sessionId}`).emit(SocketEvents.USER_TYPING, {
        userId,
        sessionId,
        timestamp: new Date()
      });
    });

    // Handle message status updates
    socket.on(SocketEvents.MESSAGE_STATUS_UPDATE, async (data: { messageId: string, status: string }) => {
      // In a production app, we'd update the message status in the database
      // and then emit the event to all relevant clients
      io.to(`user:${userId}`).emit(SocketEvents.MESSAGE_STATUS_UPDATE, {
        ...data,
        timestamp: new Date()
      });
    });

    // Join specific session/conversation
    socket.on('join:session', (sessionId: string) => {
      socket.join(`session:${sessionId}`);
      logger.info(`User ${userId} joined session ${sessionId}`);
    });

    // Leave specific session/conversation
    socket.on('leave:session', (sessionId: string) => {
      socket.leave(`session:${sessionId}`);
      logger.info(`User ${userId} left session ${sessionId}`);
    });

    // Disconnection handler
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${userId}`);
      io.emit(SocketEvents.USER_OFFLINE, { userId });
    });
  });

  return io;
}

// Helper function to emit messages to specific users
export function emitToUser(userId: string, event: string, data: any): void {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

// Helper function to emit to a specific session/conversation
export function emitToSession(sessionId: string, event: string, data: any): void {
  if (io) {
    io.to(`session:${sessionId}`).emit(event, data);
  }
}

// Helper function to broadcast to all connected clients
export function broadcastToAll(event: string, data: any): void {
  if (io) {
    io.emit(event, data);
  }
}