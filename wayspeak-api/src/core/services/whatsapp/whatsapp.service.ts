// src/core/services/whatsapp/whatsapp-service.ts
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import { 
  Client, 
  LocalAuth,
  Message as WAMessage, 
  MessageMedia, 
  Chat as WAChat,
  Contact as WAContact,
  MessageTypes,
  Location
} from 'whatsapp-web.js';
import logger from '../../../utils/logging/logger';
import { MessageStatus, MessageType } from '../../models/message.model';
import crypto from 'crypto';

// Define types for authentication sessions
interface AuthSession {
  authenticated: boolean;
  userId?: string;
  qrExpiresAt: number;
  startedAt: number;
}

// Define types for account data
export interface WhatsAppAccount {
  id: string;
  userId: string;
  name: string;
  phoneNumber: string;
  businessId?: string;
  type: 'business' | 'personal';
  status: 'connected' | 'disconnected' | 'pending';
  connectedAt: Date;
  lastActivity?: Date;
  metadata?: Record<string, any>;
}

// Define types for WhatsApp messages
export interface WhatsAppMessage {
  id: string;
  to: string;
  from: string;
  content: string;
  type: MessageType;
  timestamp: Date;
  status: MessageStatus;
  mediaUrl?: string;
}

// Define types for sending message parameters
export interface SendMessageParams {
  to: string;
  content: string;
  type: MessageType;
  mediaUrl?: string;
}

// Define response type for send message
export interface SendMessageResponse {
  messageId: string;
  status: MessageStatus;
}

/**
 * WhatsApp service using whatsapp-web.js
 */
export class WhatsAppService extends EventEmitter {
  private client: Client;
  private isInitialized: boolean = false;
  private isAuthenticated: boolean = false;
  private currentQR: string | null = null;
  private authSessions: Map<string, AuthSession> = new Map();
  private accounts: Map<string, WhatsAppAccount> = new Map();
  private dataPath: string;
  
  constructor() {
    super();
    
    // Setup data path for storing session data
    this.dataPath = path.join(process.cwd(), 'data', 'whatsapp-sessions');
    this.ensureDirectoryExists(this.dataPath);
    
    // Initialize client with LocalAuth strategy
    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: this.dataPath
      }),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    });
    
    // Register event handlers
    this.setupEventListeners();
  }
  
  /**
   * Ensure the directory exists
   */
  private ensureDirectoryExists(directory: string): void {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
  }
  
  /**
   * Set up event listeners for the WhatsApp client
   */
  private setupEventListeners(): void {
    // Handle QR code events
    this.client.on('qr', (qr: string) => {
      logger.info('Received QR code from WhatsApp');
      
      // Generate QR code image
      QRCode.toDataURL(qr, (err, url) => {
        if (err) {
          logger.error('Failed to generate QR code image', { error: err });
          return;
        }
        
        this.currentQR = url;
        
        // Emit QR code event for all active sessions
        this.authSessions.forEach((session, sessionId) => {
          if (!session.authenticated) {
            // Update QR expiry
            session.qrExpiresAt = Date.now() + 60000; // 60 seconds
            
            // Emit QR code generated event
            this.emit('qr_generated', {
              qr: url,
              sessionId,
              expiresAt: session.qrExpiresAt
            });
          }
        });
      });
    });
    
    // Handle authentication events
    this.client.on('authenticated', () => {
      logger.info('Authenticated with WhatsApp');
      this.isAuthenticated = true;
      
      // Emit authentication success for all pending sessions
      this.authSessions.forEach((session, sessionId) => {
        if (!session.authenticated) {
          session.authenticated = true;
          
          this.emit('authenticated', {
            sessionId,
            success: true
          });
          
          // If this session has a userId, create or update account
          if (session.userId) {
            this.createOrUpdateAccount(session.userId);
          }
        }
      });
      
      // Emit connection status change
      this.emit('connectionStatusChange', this.getStatus());
    });
    
    // Handle auth failure events
    this.client.on('auth_failure', (msg: string) => {
      logger.error('Authentication failed', { message: msg });
      this.isAuthenticated = false;
      
      // Emit auth failure for all pending sessions
      this.authSessions.forEach((session, sessionId) => {
        if (!session.authenticated) {
          this.emit('authentication_failed', {
            sessionId,
            error: msg
          });
        }
      });
      
      // Emit connection status change
      this.emit('connectionStatusChange', this.getStatus());
    });
    
    // Handle ready event
    this.client.on('ready', () => {
      logger.info('WhatsApp client is ready');
      this.isInitialized = true;
      
      // Emit connection status change
      this.emit('connectionStatusChange', this.getStatus());
    });
    
    // Handle disconnected event
    this.client.on('disconnected', (reason: string) => {
      logger.warn('WhatsApp client disconnected', { reason });
      this.isInitialized = false;
      this.isAuthenticated = false;
      
      // Emit connection status change
      this.emit('connectionStatusChange', this.getStatus());
    });
    
    // Handle incoming messages
    this.client.on('message', (msg: WAMessage) => {
      logger.info('Received message', { id: msg.id.id });
      
      // Convert to our message format
      this.handleIncomingMessage(msg);
    });
    
    // Handle message ACK events (delivery/read receipts)
    this.client.on('message_ack', (msg: WAMessage, ack: number) => {
      // Map WhatsApp ACK to our status
      const status = this.mapAckToStatus(ack);
      
      // Emit message status update
      this.emit('messageStatus', {
        messageId: msg.id.id,
        status,
        timestamp: new Date()
      });
    });
  }
  
  /**
   * Initialize the WhatsApp client
   */
  async initialize(): Promise<boolean> {
    try {
      logger.info('Initializing WhatsApp client');
      
      // Start the client
      await this.client.initialize();
      
      return true;
    } catch (error) {
      logger.error('Failed to initialize WhatsApp client', { error });
      return false;
    }
  }
  
  /**
   * Generate QR code for authentication
   */
  async generateAuthQR(clientId?: string): Promise<string> {
    try {
      logger.info('Generating WhatsApp QR code');
      
      // Initialize client if not already initialized
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Failed to initialize WhatsApp client');
        }
      }
      
      // Create new client ID if not provided
      const sessionId = clientId || crypto.randomUUID();
      
      // Store auth session
      this.authSessions.set(sessionId, {
        authenticated: false,
        qrExpiresAt: Date.now() + 60000, // 60 seconds
        startedAt: Date.now()
      });
      
      // Return current QR code if available
      if (this.currentQR) {
        return this.currentQR;
      }
      
      // If no QR code is available yet, return a placeholder
      // The actual QR code will be emitted via the qr_generated event
      return 'pending';
    } catch (error) {
      logger.error('Error generating authentication QR', { error });
      throw error;
    }
  }
  
  /**
   * Get authentication status for a client
   */
  getAuthStatus(clientId: string): {
    authenticated: boolean;
    qrExpired: boolean;
    timeRemaining: number;
  } {
    const session = this.authSessions.get(clientId);
    
    if (!session) {
      return {
        authenticated: false,
        qrExpired: true,
        timeRemaining: 0
      };
    }
    
    const now = Date.now();
    const timeRemaining = Math.max(0, session.qrExpiresAt - now);
    
    return {
      authenticated: session.authenticated,
      qrExpired: now > session.qrExpiresAt,
      timeRemaining
    };
  }
  
  /**
   * Complete the authentication process
   */
  completeAuthentication(clientId: string, userId: string): void {
    const session = this.authSessions.get(clientId);
    
    if (session) {
      session.authenticated = true;
      session.userId = userId;
      
      // Create or update account if authenticated
      if (this.isAuthenticated) {
        this.createOrUpdateAccount(userId);
      }
      
      // Emit authenticated event
      this.emit('authenticated', {
        clientId,
        userId
      });
    }
  }
  
  /**
   * Create or update WhatsApp account for user
   */
  private async createOrUpdateAccount(userId: string): Promise<void> {
    try {
      // Get client info
      const info = this.client.info;
      if (!info) return;
      
      const phoneNumber = info.wid.user;
      const accountId = `wa_${phoneNumber}`;
      
      // Check if account already exists
      const existingAccount = this.accounts.get(accountId);
      
      if (existingAccount) {
        // Update existing account
        existingAccount.status = 'connected';
        existingAccount.lastActivity = new Date();
        this.accounts.set(accountId, existingAccount);
      } else {
        // Create new account
        const newAccount: WhatsAppAccount = {
          id: accountId,
          userId,
          name: info.pushname || 'WhatsApp User',
          phoneNumber: `+${phoneNumber}`,
          type: 'personal',
          status: 'connected',
          connectedAt: new Date(),
          lastActivity: new Date()
        };
        
        this.accounts.set(accountId, newAccount);
      }
      
      // Save accounts to file
      this.saveAccounts();
    } catch (error) {
      logger.error('Error creating/updating account', { error, userId });
    }
  }
  
  /**
   * Save accounts to file
   */
  private saveAccounts(): void {
    try {
      const accountsPath = path.join(this.dataPath, 'accounts.json');
      const accountsData = JSON.stringify(Array.from(this.accounts.values()), null, 2);
      
      fs.writeFileSync(accountsPath, accountsData);
    } catch (error) {
      logger.error('Error saving accounts', { error });
    }
  }
  
  /**
   * Load accounts from file
   */
  private loadAccounts(): void {
    try {
      const accountsPath = path.join(this.dataPath, 'accounts.json');
      
      if (fs.existsSync(accountsPath)) {
        const accountsData = fs.readFileSync(accountsPath, 'utf8');
        const accounts = JSON.parse(accountsData) as WhatsAppAccount[];
        
        accounts.forEach(account => {
          this.accounts.set(account.id, account);
        });
        
        logger.info(`Loaded ${accounts.length} WhatsApp accounts`);
      }
    } catch (error) {
      logger.error('Error loading accounts', { error });
    }
  }
  
  /**
   * Send a message via WhatsApp
   */
  async sendMessage(params: SendMessageParams): Promise<SendMessageResponse> {
    try {
      // Ensure client is initialized and authenticated
      if (!this.isInitialized || !this.isAuthenticated) {
        throw new Error('WhatsApp client not initialized or authenticated');
      }
      
      // Format phone number
      const formattedNumber = this.formatPhoneNumber(params.to);
      const chatId = `${formattedNumber}@c.us`;
      
      // Different handling based on message type
      let sentMessage;
      
      switch (params.type) {
        case MessageType.IMAGE:
        case MessageType.VIDEO:
        case MessageType.AUDIO:
        case MessageType.DOCUMENT:
          if (!params.mediaUrl) {
            throw new Error(`Media URL is required for ${params.type} messages`);
          }
          
          // Download and send media
          const media = await MessageMedia.fromUrl(params.mediaUrl);
          sentMessage = await this.client.sendMessage(chatId, media, {
            caption: params.content
          });
          break;
          
        // case MessageType.LOCATION:
        //   // Parse location from content (expected format: "latitude,longitude")
        //   const [latitude, longitude] = params.content.split(',').map(Number);
          
        //   if (isNaN(latitude) || isNaN(longitude)) {
        //     throw new Error('Invalid location format. Expected "latitude,longitude"');
        //   }
          
        //   sentMessage = await this.client.sendMessage(chatId, {
        //     new Location(latitude, longitude)
        //   });
        //   break;
          
        case MessageType.TEXT:
        default:
          // Send regular text message
          sentMessage = await this.client.sendMessage(chatId, params.content);
          break;
      }
      
      return {
        messageId: sentMessage.id.id,
        status: MessageStatus.SENT,
      };
    } catch (error) {
      logger.error('Error sending message', { error, params });
      throw error;
    }
  }
  
  /**
   * Handle incoming message from WhatsApp
   */
  private async handleIncomingMessage(msg: WAMessage): Promise<void> {
    try {
      // Skip messages from self
      if (msg.fromMe) return;
      
      // Get chat and contact
      const chat = await msg.getChat();
      const contact = await msg.getContact();
      
      // Determine message type
      const messageType = this.mapWATypeToMessageType(msg.type);
      
      // Create message object
      const message: WhatsAppMessage = {
        id: msg.id.id,
        from: msg.from,
        to: msg.to,
        content: msg.body,
        type: messageType,
        timestamp: new Date(msg.timestamp * 1000),
        status: MessageStatus.DELIVERED,
        mediaUrl: await this.extractMediaUrl(msg)
      };
      
      // Emit message event
      this.emit('message', message);
    } catch (error) {
      logger.error('Error handling incoming message', { error, messageId: msg.id.id });
    }
  }
  
  /**
   * Extract media URL from message
   */
  private async extractMediaUrl(msg: WAMessage): Promise<string | undefined> {
    if (!msg.hasMedia) return undefined;
    
    try {
      // This would need to save the media and return a URL to it
      // For demonstration, we're returning a placeholder
      return `media/${msg.id.id}`;
    } catch (error) {
      logger.error('Error extracting media URL', { error, messageId: msg.id.id });
      return undefined;
    }
  }
  
  /**
   * Get all WhatsApp accounts for a user
   */
  async getUserAccounts(userId: string): Promise<WhatsAppAccount[]> {
    // Load accounts first in case they were created in another session
    this.loadAccounts();
    
    const userAccounts: WhatsAppAccount[] = [];
    
    this.accounts.forEach(account => {
      if (account.userId === userId) {
        userAccounts.push(account);
      }
    });
    
    return userAccounts;
  }
  
  /**
   * Get a specific WhatsApp account
   */
  async getAccount(accountId: string, userId: string): Promise<WhatsAppAccount | null> {
    // Load accounts first
    this.loadAccounts();
    
    const account = this.accounts.get(accountId);
    
    if (account && account.userId === userId) {
      return account;
    }
    
    return null;
  }
  
  /**
   * Disconnect a WhatsApp account
   */
  async disconnectAccount(accountId: string, userId: string): Promise<boolean> {
    const account = this.accounts.get(accountId);
    
    if (!account || account.userId !== userId) {
      return false;
    }
    
    try {
      // Update account status
      account.status = 'disconnected';
      this.accounts.set(accountId, account);
      
      // Save accounts
      this.saveAccounts();
      
      // Logout from WhatsApp if this is the current account
      if (this.isAccountActive(account)) {
        await this.client.logout();
        this.isAuthenticated = false;
        this.isInitialized = false;
      }
      
      // Emit event for account disconnection
      this.emit('account_disconnected', { accountId, userId });
      
      return true;
    } catch (error) {
      logger.error('Error disconnecting account', { error, accountId });
      return false;
    }
  }
  
  /**
   * Check if an account is currently active
   */
  private isAccountActive(account: WhatsAppAccount): boolean {
    if (!this.isAuthenticated || !this.client.info) return false;
    
    // Extract phone number from account
    const phoneNumber = account.phoneNumber.replace(/\D/g, '');
    
    // Compare with current client info
    return this.client.info.wid.user === phoneNumber;
  }
  
  /**
   * Get connection status
   */
  getStatus(): { connected: boolean; authenticated: boolean } {
    return {
      connected: this.isInitialized,
      authenticated: this.isAuthenticated,
    };
  }
  
  /**
   * Disconnect from WhatsApp
   */
  async disconnect(): Promise<boolean> {
    try {
      if (this.isInitialized) {
        await this.client.logout();
        
        this.isInitialized = false;
        this.isAuthenticated = false;
        
        // Emit connection status change
        this.emit('connectionStatusChange', this.getStatus());
      }
      
      return true;
    } catch (error) {
      logger.error('Error disconnecting from WhatsApp', { error });
      return false;
    }
  }
  
  /**
   * Format phone number to WhatsApp format
   */
  private formatPhoneNumber(phone: string): string {
    // Remove any non-numeric characters
    return phone.replace(/\D/g, '');
  }
  
  /**
   * Map WhatsApp message type to our message type
   */
  private mapWATypeToMessageType(type: string): MessageType {
    switch (type) {
      case MessageTypes.TEXT:
        return MessageType.TEXT;
      case MessageTypes.IMAGE:
        return MessageType.IMAGE;
      case MessageTypes.AUDIO:
      case MessageTypes.VOICE:
        return MessageType.AUDIO;
      case MessageTypes.VIDEO:
        return MessageType.VIDEO;
      case MessageTypes.DOCUMENT:
        return MessageType.DOCUMENT;
      case MessageTypes.LOCATION:
        return MessageType.LOCATION;
      default:
        return MessageType.TEXT;
    }
  }
  
  /**
   * Map WhatsApp ACK to our status
   */
  private mapAckToStatus(ack: number): MessageStatus {
    switch (ack) {
      case 1: // MessageAck.ACK_PENDING
        return MessageStatus.PENDING;
      case 2: // MessageAck.ACK_SERVER
        return MessageStatus.SENT;
      case 3: // MessageAck.ACK_DEVICE
        return MessageStatus.DELIVERED;
      case 4: // MessageAck.ACK_READ
        return MessageStatus.READ;
      case -1: // MessageAck.ACK_ERROR
        return MessageStatus.FAILED;
      default:
        return MessageStatus.PENDING;
    }
  }
  
  /**
   * Gracefully shut down the connection
   */
  async shutdown(): Promise<void> {
    try {
      logger.info('Shutting down WhatsApp client');
      
      // Disconnect WhatsApp client
      if (this.isInitialized) {
        await this.client.destroy();
      }
      
      this.isInitialized = false;
      this.isAuthenticated = false;
      
      // Clear all listeners
      this.removeAllListeners();
    } catch (error) {
      logger.error('Error shutting down WhatsApp client', { error });
    }
  }
}

// Export a singleton instance
export const whatsAppService = new WhatsAppService();