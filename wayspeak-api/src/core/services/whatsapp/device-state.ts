
// src/core/services/whatsapp/device-state.ts
import { randomBytes } from 'crypto';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import logger from '../../../utils/logging/logger';

const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);
const mkdirAsync = promisify(fs.mkdir);

/**
 * Manages device state and credentials for WhatsApp connection
 */
export class DeviceState {
    private statePath: string;
    private credentials: any = null;
    private encryptionKey: Buffer | null = null;

    constructor() {
        // Set path for storing device state
        this.statePath = path.join(process.cwd(), 'data', 'whatsapp-state');
    }

    /**
     * Load device state from disk
     */
    async load(): Promise<void> {
        try {
            // Ensure directory exists
            await this.ensureDirectory();

            // Try to load credentials
            const credentialsPath = path.join(this.statePath, 'credentials.json');
            if (fs.existsSync(credentialsPath)) {
                const data = await readFileAsync(credentialsPath, 'utf8');
                this.credentials = JSON.parse(data);
                logger.info('Loaded WhatsApp credentials');
            }

            // Try to load encryption key
            const keyPath = path.join(this.statePath, 'key.bin');
            if (fs.existsSync(keyPath)) {
                this.encryptionKey = await readFileAsync(keyPath);
                logger.info('Loaded encryption key');
            } else {
                // Generate new key if none exists
                this.encryptionKey = randomBytes(32);
                await this.saveEncryptionKey();
                logger.info('Generated new encryption key');
            }
        } catch (error) {
            logger.error('Error loading device state', { error });
            // Generate new key if loading failed
            this.encryptionKey = randomBytes(32);
        }
    }

    //   clearCredentials
    async clearCredentials(): Promise<void> {
        try {
            // Clear credentials
            this.credentials = null;

            // Clear credentials from disk
            const credentialsPath = path.join(this.statePath, 'credentials.json');
            if (fs.existsSync(credentialsPath)) {
                await writeFileAsync(credentialsPath, '');
            }

            logger.info('Cleared WhatsApp credentials');
        } catch (error) {
            logger.error('Error clearing credentials', { error });
            throw error;
        }
    }

    // getAccounts
    getAccounts(): any {
        return this.credentials?.accounts || [];
    }

    // saveAccounts
    async saveAccounts(accounts: any[]): Promise<void> {
        try {
            if (!this.credentials) {
                throw new Error('No credentials loaded');
            }

            this.credentials.accounts = accounts;

            // Save accounts to disk
            const credentialsPath = path.join(this.statePath, 'credentials.json');
            await writeFileAsync(credentialsPath, JSON.stringify(this.credentials, null, 2));

            logger.info('Saved WhatsApp accounts');
        } catch (error) {
            logger.error('Error saving accounts', { error });
            throw error;
        }
    }

    /**
     * Save WhatsApp credentials
     */
    async saveCredentials(credentials: any): Promise<void> {
        try {
            this.credentials = credentials;

            // Ensure directory exists
            await this.ensureDirectory();

            // Save credentials to disk
            const credentialsPath = path.join(this.statePath, 'credentials.json');
            await writeFileAsync(credentialsPath, JSON.stringify(credentials, null, 2));

            logger.info('Saved WhatsApp credentials');
        } catch (error) {
            logger.error('Error saving credentials', { error });
            throw error;
        }
    }

    /**
     * Check if we have valid credentials
     */
    hasCredentials(): boolean {
        return this.credentials !== null;
    }

    /**
     * Get stored credentials
     */
    getCredentials(): any {
        return this.credentials;
    }

    /**
     * Get encryption key
     */
    getEncryptionKey(): Buffer {
        if (!this.encryptionKey) {
            throw new Error('Encryption key not initialized');
        }
        return this.encryptionKey;
    }

    /**
     * Set encryption key
     */
    setEncryptionKey(key: Buffer): void {
        this.encryptionKey = key;
        this.saveEncryptionKey().catch(error => {
            logger.error('Error saving encryption key', { error });
        });
    }

    /**
     * Save encryption key to disk
     */
    private async saveEncryptionKey(): Promise<void> {
        if (!this.encryptionKey) return;

        try {
            // Ensure directory exists
            await this.ensureDirectory();

            // Save key to disk
            const keyPath = path.join(this.statePath, 'key.bin');
            await writeFileAsync(keyPath, this.encryptionKey);
        } catch (error) {
            logger.error('Error saving encryption key', { error });
            throw error;
        }
    }

    /**
     * Ensure the state directory exists
     */
    private async ensureDirectory(): Promise<void> {
        try {
            if (!fs.existsSync(this.statePath)) {
                await mkdirAsync(this.statePath, { recursive: true });
            }
        } catch (error) {
            logger.error('Error creating state directory', { error });
            throw error;
        }
    }
}