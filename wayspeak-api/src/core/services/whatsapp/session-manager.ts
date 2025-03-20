// src/core/services/whatsapp/session-manager.ts
import { EventEmitter } from 'events';
import crypto from 'crypto';
import logger from '../../../utils/logging/logger';
import { DeviceState } from './device-state';

/**
 * Session types
 */
export enum SessionType {
  QR_AUTH = 'qr_auth',     // QR code authentication
  API_KEY = 'api_key',     // API key session
  BUSINESS = 'business',   // Business account
  PERSONAL = 'personal',   // Personal account
}

/**
 * Session status
 */
export enum SessionStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  FAILED = 'failed',
}

/**
 * Session data structure
 */
export interface Session {
  id: string;
  type: SessionType;
  userId?: string;
  clientId?: string;
  status: SessionStatus;
  qrCode?: string;
  qrExpiresAt?: number;
  createdAt: number;
  expiresAt?: number;
  businessId?: string;
  phoneNumber?: string;
  metadata?: Record<string, any>;
}

/**
 * Manages WhatsApp sessions
 */
export class SessionManager extends EventEmitter {
  private sessions: Map<string, Session> = new Map();
  private deviceState: DeviceState;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly QR_EXPIRY_TIME = 60000; // 60 seconds
  private readonly SESSION_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours
  
  constructor(deviceState: DeviceState) {
    super();
    this.deviceState = deviceState;
    this.startCleanupInterval();
  }
  
  /**
   * Create a new QR authentication session
   */
  createQRSession(clientId?: string, userId?: string): Session {
    const sessionId = clientId || crypto.randomUUID();
    const now = Date.now();
    
    const session: Session = {
      id: sessionId,
      type: SessionType.QR_AUTH,
      userId,
      clientId,
      status: SessionStatus.PENDING,
      createdAt: now,
      qrExpiresAt: now + this.QR_EXPIRY_TIME,
    };
    
    this.sessions.set(sessionId, session);
    
    logger.info('Created QR authentication session', { sessionId, userId });
    return session;
  }
  
  /**
   * Update a session with QR code data
   */
  setSessionQR(sessionId: string, qrCode: string): Session | null {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      logger.warn('Attempted to set QR for non-existent session', { sessionId });
      return null;
    }
    
    const now = Date.now();
    
    // Update session with QR code
    session.qrCode = qrCode;
    session.qrExpiresAt = now + this.QR_EXPIRY_TIME;
    
    this.sessions.set(sessionId, session);
    
    logger.info('Updated session with QR code', { sessionId });
    
    // Emit QR code event
    this.emit('qr_generated', {
      sessionId,
      qr: qrCode,
      expiresAt: session.qrExpiresAt,
    });
    
    return session;
  }
  
  /**
   * Mark a session as active (authenticated)
   */
  activateSession(sessionId: string, userId: string, phoneNumber?: string): Session | null {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      logger.warn('Attempted to activate non-existent session', { sessionId, userId });
      return null;
    }
    
    // Update session status
    session.status = SessionStatus.ACTIVE;
    session.userId = userId;
    session.phoneNumber = phoneNumber;
    session.expiresAt = Date.now() + this.SESSION_EXPIRY_TIME;
    
    this.sessions.set(sessionId, session);
    
    logger.info('Activated session', { sessionId, userId });
    
    // Emit authenticated event
    this.emit('authenticated', {
      sessionId,
      userId,
      phoneNumber,
    });
    
    return session;
  }
  
  /**
   * Mark a session as failed
   */
  failSession(sessionId: string, error: string): Session | null {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      logger.warn('Attempted to fail non-existent session', { sessionId });
      return null;
    }
    
    // Update session status
    session.status = SessionStatus.FAILED;
    session.metadata = {
      ...(session.metadata || {}),
      error,
      failedAt: Date.now(),
    };
    
    this.sessions.set(sessionId, session);
    
    logger.info('Marked session as failed', { sessionId, error });
    
    // Emit failed event
    this.emit('auth_failure', {
      sessionId,
      error,
    });
    
    return session;
  }
  
  /**
   * Get a session by ID
   */
  getSession(sessionId: string): Session | null {
    return this.sessions.get(sessionId) || null;
  }
  
  /**
   * Get all sessions for a user
   */
  getUserSessions(userId: string): Session[] {
    const userSessions: Session[] = [];
    
    this.sessions.forEach(session => {
      if (session.userId === userId) {
        userSessions.push(session);
      }
    });
    
    return userSessions;
  }
  
  /**
   * Get active session for a user
   */
  getUserActiveSession(userId: string): Session | null {
    for (const session of this.sessions.values()) {
      if (session.userId === userId && session.status === SessionStatus.ACTIVE) {
        return session;
      }
    }
    
    return null;
  }
  
  /**
   * Remove a session
   */
  removeSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }
  
  /**
   * Check if a session's QR code has expired
   */
  isQRExpired(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    
    if (!session || !session.qrExpiresAt) {
      return true;
    }
    
    return Date.now() > session.qrExpiresAt;
  }
  
  /**
   * Start the cleanup interval to remove expired sessions
   */
  private startCleanupInterval(): void {
    // Clean up every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 5 * 60 * 1000);
  }
  
  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    let expiredCount = 0;
    
    this.sessions.forEach((session, sessionId) => {
      // Check for expired QR codes
      if (session.status === SessionStatus.PENDING && session.qrExpiresAt && now > session.qrExpiresAt) {
        session.status = SessionStatus.EXPIRED;
        this.emit('qr_expired', { sessionId });
      }
      
      // Check for expired sessions
      if (session.expiresAt && now > session.expiresAt) {
        this.sessions.delete(sessionId);
        expiredCount++;
      }
      
      // Remove failed and expired sessions after a while
      if (
        (session.status === SessionStatus.FAILED || session.status === SessionStatus.EXPIRED) &&
        now - session.createdAt > 30 * 60 * 1000 // 30 minutes
      ) {
        this.sessions.delete(sessionId);
        expiredCount++;
      }
    });
    
    if (expiredCount > 0) {
      logger.info(`Cleaned up ${expiredCount} expired sessions`);
    }
  }
  
  /**
   * Shutdown the session manager
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}