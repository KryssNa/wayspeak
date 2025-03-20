// src/utils/logging/logger.ts
import winston from 'winston';
import config from '../../config';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define level based on environment
const level = () => {
  const env = config.server.env;
  return env === 'development' ? 'debug' : 'info';
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Add colors to winston
winston.addColors(colors);

// Define format for logs
const format = winston.format.combine(
  // Add timestamp
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  // Add colors if in development
  config.server.env === 'development'
    ? winston.format.colorize({ all: true })
    : winston.format.uncolorize(),
  // Define log format
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message} ${
      info.splat !== undefined ? `${info.splat}` : ''
    } ${
      info.metadata && Object.keys(info.metadata).length
        ? `\n${JSON.stringify(info.metadata, null, 2)}`
        : ''
    }`
  )
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console(),
  // File transport for all logs
  new winston.transports.File({
    filename: 'logs/all.log',
  }),
  // File transport for error logs
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
  }),
];

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  // Don't exit on error
  exitOnError: false,
});

export default logger;