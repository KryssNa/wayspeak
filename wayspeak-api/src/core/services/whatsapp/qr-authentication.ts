// src/core/services/whatsapp/qr-authentication.ts
import crypto from 'crypto';
import { EventEmitter } from 'events';
import QRCode from 'qrcode';
import logger from '../../../utils/logging/logger';
import { WhatsAppConnection } from './connection-manager';
import { DeviceState } from './device-state';

/**
 * Authentication events interface
 */
export interface QRAuthenticationEvents {
    qr_generated: (data: { qr: string; sessionId: string; expiresAt: number }) => void;
    authenticated: (data: { sessionId: string; success: boolean; credentials?: any }) => void;
    authentication_failed: (data: { sessionId: string; error: string }) => void;
}

/**
 * Handles WhatsApp QR code authentication
 */
export class QRAuthentication extends EventEmitter {
    private deviceState: DeviceState;
    private connection: WhatsAppConnection;
    private currentQR: string | null = null;
    private qrGeneratedAt: number = 0;
    private qrExpiryTime: number = 60000; // 60 seconds
    private authenticationInProgress: boolean = false;
    private sessionId: string | null = null;

    constructor(deviceState: DeviceState, connection: WhatsAppConnection) {
        super();
        this.deviceState = deviceState;
        this.connection = connection;

        // Listen for authentication events from connection
        this.connection.on('authenticated', (credentials: any) => {
            // Store credentials
            this.deviceState.saveCredentials(credentials).catch(error => {
                logger.error('Error saving authentication credentials', { error });
            });

            this.authenticationInProgress = false;
            this.currentQR = null;

            // Emit successful authentication
            this.emit('authenticated', {
                success: true,
                sessionId: this.sessionId || '',
                credentials
            });
        });

        this.connection.on('auth_failure', (error: Error) => {
            this.authenticationInProgress = false;

            // Emit authentication failure
            this.emit('authentication_failed', {
                error: error.message,
                sessionId: this.sessionId || ''
            });
        });
    }

    /**
     * Generate a QR code for WhatsApp authentication
     */
    async generateQR(clientId?: string): Promise<string> {
        try {
            // Check if we already have an active QR code that hasn't expired
            const now = Date.now();
            if (this.currentQR && (now - this.qrGeneratedAt < this.qrExpiryTime)) {
                return this.currentQR;
            }

            // Generate a new session ID if not provided
            this.sessionId = clientId || crypto.randomUUID();

            // Start the authentication process
            this.authenticationInProgress = true;

            // Request QR code from WhatsApp connection
            const qrData = await this.connection.requestQR();

            // Generate QR code image
            const qrImage = await QRCode.toDataURL(qrData);

            // Store QR data
            this.currentQR = qrImage;
            this.qrGeneratedAt = Date.now();

            // Emit QR code event
            this.emit('qr_generated', {
                qr: qrImage,
                sessionId: this.sessionId,
                expiresAt: this.qrGeneratedAt + this.qrExpiryTime
            });

            return qrImage;
        } catch (error) {
            logger.error('Error generating QR code', { error });
            throw error;
        }
    }

    /**
     * Check if authentication is in progress
     */
    isAuthenticating(): boolean {
        return this.authenticationInProgress;
    }

    /**
     * Check if QR code has expired
     */
    isQRExpired(): boolean {
        if (!this.currentQR) return true;
        return (Date.now() - this.qrGeneratedAt) > this.qrExpiryTime;
    }

    /**
     * Get current QR code status
     */
    getQRStatus(): {
        exists: boolean;
        expired: boolean;
        expiresAt: number | null;
        authenticating: boolean;
    } {
        const exists = !!this.currentQR;
        const expiresAt = exists ? this.qrGeneratedAt + this.qrExpiryTime : null;

        return {
            exists,
            expired: this.isQRExpired(),
            expiresAt,
            authenticating: this.authenticationInProgress
        };
    }

    // Type declaration for the event emitter
    on<E extends keyof QRAuthenticationEvents>(
        event: E,
        listener: QRAuthenticationEvents[E]
    ): this {
        return super.on(event, listener as any);
    }

    emit<E extends keyof QRAuthenticationEvents>(
        event: E,
        ...args: Parameters<QRAuthenticationEvents[E]>
    ): boolean {
        return super.emit(event, ...args);
    }

    removeListener<E extends keyof QRAuthenticationEvents>(
        event: E,
        listener: QRAuthenticationEvents[E]
    ): this {
        return super.removeListener(event, listener as any);
    }
}