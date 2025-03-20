// src/socket/index.ts
import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { userService } from '../core/services/user.service';
import { whatsAppService } from '../core/services/whatsapp/whatsapp.service';
import logger from '../utils/logging/logger';

/**
 * Socket.io server for real-time communication
 */
export class SocketService {
    private io!: SocketIOServer;

    /**
     * Initialize the Socket.io server
     */
    initialize(server: HttpServer): void {
        this.io = new SocketIOServer(server, {
            path: '/api/v1/socket.io',
            cors: {
                origin: '*', // In production, set to your frontend domains
                methods: ['GET', 'POST'],
                credentials: true
            }
        });

        // Set up authentication middleware
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;

                if (!token) {
                    return next(new Error('Authentication required'));
                }

                // Verify token
                const userId = userService.verifyToken(token);

                if (!userId) {
                    return next(new Error('Invalid token'));
                }

                // Get user details
                const user = await userService.getUserById(userId);

                if (!user) {
                    return next(new Error('User not found'));
                }

                // Attach user data to socket
                socket.data.user = user;
                socket.data.userId = userId;

                next();
            } catch (error) {
                logger.error('Socket authentication error', { error });
                next(new Error('Authentication failed'));
            }
        });

        // Handle client connections
        this.io.on('connection', (socket) => {
            const userId = socket.data.userId;
            logger.info('Client connected to socket', { userId, socketId: socket.id });

            // Add socket to user's room
            socket.join(`user:${userId}`);

            // Handle WhatsApp QR code request
            socket.on('whatsapp:requestQR', async () => {
                try {
                    logger.info('QR code requested', { userId });

                    // Check if already connected
                    const status = whatsAppService.getStatus();

                    if (status.authenticated) {
                        socket.emit('whatsapp:status', {
                            authenticated: true,
                            connected: true
                        });
                        return;
                    }

                    // Generate a new QR code
                    const clientId = socket.id;
                    const qrCode = await whatsAppService.generateAuthQR(clientId);

                    // Send QR code to client
                    socket.emit('whatsapp:qrCode', { qrCode });
                } catch (error) {
                    logger.error('Error generating WhatsApp QR code', { error, userId });
                    socket.emit('whatsapp:error', {
                        message: 'Failed to generate QR code'
                    });
                }
            });

            // Handle disconnect event
            socket.on('disconnect', () => {
                logger.info('Client disconnected from socket', { userId, socketId: socket.id });
            });
        });

        // Listen for WhatsApp events
        this.setupWhatsAppListeners();

        logger.info('Socket.io server initialized');
    }

    /**
     * Set up listeners for WhatsApp events
     */
    private setupWhatsAppListeners(): void {
        // Listen for QR code generation
        whatsAppService.on('qr_generated', (data) => {
            const { sessionId, qr } = data;
            logger.info('WhatsApp QR code generated', { sessionId });

            // Emit to the specific client
            this.io.to(sessionId).emit('whatsapp:qrCode', { qrCode: qr });
        });

        // Listen for connection status changes
        whatsAppService.on('connectionStatusChange', (status) => {
            logger.info('WhatsApp connection status changed', { status });

            // Broadcast to all connected clients
            this.io.emit('whatsapp:connectionStatus', status);
        });

        // Listen for successful authentication
        whatsAppService.on('authenticated', (data) => {
            const { clientId, userId } = data;
            logger.info('WhatsApp authenticated', { clientId, userId });

            // Emit to all user's connections
            if (userId) {
                this.io.to(`user:${userId}`).emit('whatsapp:authenticated', {
                    authenticated: true
                });
            }

            // Also emit to the specific client
            if (clientId) {
                this.io.to(clientId).emit('whatsapp:authenticated', {
                    authenticated: true
                });
            }
        });

        // Listen for authentication failures
        whatsAppService.on('auth_failure', (data) => {
            const { sessionId, error } = data;
            logger.error('WhatsApp authentication failed', { sessionId, error });

            // Emit to the specific client
            this.io.to(sessionId).emit('whatsapp:error', {
                message: 'Authentication failed',
                details: error
            });
        });

        // Listen for incoming messages
        whatsAppService.on('message', (message) => {
            const userId = message.userId.toString();
            logger.info('New WhatsApp message received', { messageId: message._id, userId });

            // Emit to all user's connections
            this.io.to(`user:${userId}`).emit('whatsapp:message', message);
        });

        // Listen for message status updates
        whatsAppService.on('messageStatus', (update) => {
            const userId = update.userId.toString();
            logger.info('WhatsApp message status updated', { messageId: update.messageId, status: update.status, userId });

            // Emit to all user's connections
            this.io.to(`user:${userId}`).emit('whatsapp:status', update);
        });
    }

    /**
     * Send a message to a specific user
     */
    sendToUser(userId: string, event: string, data: any): void {
        this.io.to(`user:${userId}`).emit(event, data);
    }

    /**
     * Broadcast a message to all connected clients
     */
    broadcast(event: string, data: any): void {
        this.io.emit(event, data);
    }

    /**
     * Get the Socket.io server instance
     */
    getIO(): SocketIOServer {
        return this.io;
    }
}

// Export singleton instance
export const socketService = new SocketService();
