// src/core/services/whatsapp/connection-manager.ts
import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { ProtocolHandler } from './protocol-handler';
import logger from '../../../utils/logging/logger';

/**
 * Manages the WebSocket connection to WhatsApp servers
 */
export class WhatsAppConnection extends EventEmitter {
  private ws: WebSocket | null = null;
  private protocolHandler: ProtocolHandler;
  private keepAliveInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private whatsappEndpoint: string = 'wss://web.whatsapp.com/ws';
  
  constructor(protocolHandler: ProtocolHandler) {
    super();
    this.protocolHandler = protocolHandler;
  }
  
  /**
   * Connect to WhatsApp servers
   */
  async connect(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        // Close existing connection if any
        if (this.ws) {
          this.ws.terminate();
          this.ws = null;
        }
        
        // Clear any existing intervals/timeouts
        this.clearTimers();
        
        // Connect to WhatsApp WebSocket server
        this.ws = new WebSocket(this.whatsappEndpoint, {
          origin: 'https://web.whatsapp.com'
        });
        
        // Set up event handlers
        this.ws.on('open', () => {
          logger.info('WebSocket connection established');
          this.setupKeepAlive();
          resolve(true);
        });
        
        this.ws.on('message', (data: WebSocket.Data) => {
          // Pass received data to protocol handler
          this.protocolHandler.handleData(data as Buffer);
        });
        
        this.ws.on('close', (code, reason) => {
          logger.warn('WebSocket connection closed', { code, reason: reason.toString() });
          this.clearTimers();
          this.emit('disconnect', { code, reason: reason.toString() });
          
          // Set up reconnect if not explicitly disconnected
          if (code !== 1000) {
            this.setupReconnect();
          }
        });
        
        this.ws.on('error', (error) => {
          logger.error('WebSocket error', { error });
          resolve(false);
        });
        
        // Set connection timeout
        setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            logger.error('WebSocket connection timeout');
            if (this.ws) {
              this.ws.terminate();
              this.ws = null;
            }
            resolve(false);
          }
        }, 10000); // 10 second timeout
      } catch (error) {
        logger.error('Error connecting to WhatsApp', { error });
        resolve(false);
      }
    });
  }

//   request requestQR()
//   generateQR()
 async requestQR(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return reject(new Error('WebSocket not connected'));
      }

        this.ws.send(JSON.stringify({ type: 'qr' }), (error) => {
            if (error) {
            logger.error('Error sending QR request', { error });
            return reject(error);
            }
        });
    }
    );
  }
  
  /**
   * Send data over the WebSocket connection
   */
  async send(data: any): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return reject(new Error('WebSocket not connected'));
      }
      
      this.ws.send(data, (error) => {
        if (error) {
          logger.error('Error sending data', { error });
          return reject(error);
        }
        resolve(true);
      });
    });
  }
  
  /**
   * Disconnect from WhatsApp servers
   */
  async disconnect(): Promise<void> {
    this.clearTimers();
    
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        // Send logout/disconnect message if needed
        // await this.send({ type: 'disconnect' });
        
        // Close the connection gracefully
        this.ws.close(1000, 'Normal closure');
      } else {
        // Force close if not in OPEN state
        this.ws.terminate();
      }
      
      this.ws = null;
    }
  }
  
  /**
   * Set up keep-alive mechanism
   */
  private setupKeepAlive(): void {
    // Clear any existing interval
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
    }
    
    // Set up new keep-alive interval
    this.keepAliveInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // Send keep-alive ping
        this.ws.ping();
      }
    }, 30000); // 30 seconds
  }
  
  /**
   * Set up reconnection mechanism
   */
  private setupReconnect(): void {
    // Clear any existing timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    // Set up new reconnect timeout
    this.reconnectTimeout = setTimeout(() => {
      logger.info('Attempting to reconnect to WhatsApp');
      this.connect()
        .then((connected) => {
          if (!connected) {
            // If reconnection failed, try again
            this.setupReconnect();
          }
        })
        .catch(() => {
          // If reconnection failed with error, try again
          this.setupReconnect();
        });
    }, 5000); // 5 seconds
  }
  
  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
}
