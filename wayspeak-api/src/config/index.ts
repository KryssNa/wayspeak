import dotenv from 'dotenv';
dotenv.config();

// config.ts
interface JwtConfig {
  secret: string;
  expiresIn: string | number;
  refreshExpiresIn: string | number;
}

const config = {
  server: {
    port: parseInt(process.env.PORT || '5500', 10),
    env: process.env.NODE_ENV || 'development',
    apiVersion: process.env.API_VERSION || 'v1',
  },
  database: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/wayspeak',
    name: process.env.MONGO_DB_NAME || 'wayspeak',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  whatsapp: {
    // If using the official API
    apiKey: process.env.WHATSAPP_API_KEY || '',
    apiUrl: process.env.WHATSAPP_API_URL || '',
      
    // For direct implementation
    stateDir: process.env.WHATSAPP_STATE_DIR || './data/whatsapp-state',
    phoneNumber: process.env.WHATSAPP_PHONE_NUMBER || '', // Your WhatsApp business phone number
    reconnectAttempts: parseInt(process.env.WHATSAPP_RECONNECT_ATTEMPTS || '5', 10),
    websocketEndpoint: process.env.WHATSAPP_WS_ENDPOINT || 'wss://web.whatsapp.com/ws',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'wayspeak_secret_key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  } as JwtConfig,

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
  storage: {
    type: process.env.STORAGE_TYPE || 'local',
    path: process.env.STORAGE_PATH || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10', 10) * 1024 * 1024, // Convert MB to bytes
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
};

export default config;
