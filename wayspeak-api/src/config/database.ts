// src/config/database.ts
import { MongoClient, Db } from 'mongodb';
import logger from '../utils/logging/logger';
import config from '../config';

/**
 * Database service responsible for handling MongoDB connections
 */
class DatabaseService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isInitialized = false;

  /**
   * Connect to the MongoDB database
   */
  async connect(): Promise<void> {
    try {
      if (this.client) {
        logger.info('Using existing database connection');
        return;
      }

      logger.info('Connecting to MongoDB...');
      
      this.client = new MongoClient(config.database.uri);
      await this.client.connect();
      
      this.db = this.client.db(config.database.name);
      this.isInitialized = true;
      
      logger.info('Successfully connected to MongoDB');
    } catch (error) {
      logger.error('Error connecting to MongoDB', { error });
      throw error;
    }
  }

  /**
   * Get the database instance
   */
  getDb(): Db {
    if (!this.isInitialized || !this.db) {
      throw new Error('Database not initialized. Call connect first.');
    }
    return this.db;
  }

  /**
   * Check if the database is initialized
   */
  isConnected(): boolean {
    return this.isInitialized;
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.isInitialized = false;
      this.db = null;
      this.client = null;
      logger.info('Database connection closed');
    }
  }
}

// Export a singleton instance
const databaseService = new DatabaseService();
export default databaseService;