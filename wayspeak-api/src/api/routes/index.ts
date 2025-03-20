// src/api/routes/index.ts

import { Express } from 'express';
import path from 'path';
import authRoutes from './auth.routes';
import messageRoutes from './message.routes';
import templateRoutes from './template.routes';
import webhookRoutes from './webhook.routes';
import analyticsRoutes from './analytics.routes';
import mediaRoutes from './media.routes';
import sessionRoutes from './session.routes';
import whatsappAuthRoutes from './whatsapp-auth.routes';
import whatsappRoutes from './whatsapp.routes';
import config from '../../config';

export function setupRoutes(app: Express): void {
  const apiVersion = config.server.apiVersion;
  const basePath = `/api/${apiVersion}`;
  
  // API routes
  app.use(`${basePath}/auth`, authRoutes);
  app.use(`${basePath}/messages`, messageRoutes);
  app.use(`${basePath}/templates`, templateRoutes);
  app.use(`${basePath}/webhooks`, webhookRoutes);
  app.use(`${basePath}/analytics`, analyticsRoutes);
  app.use(`${basePath}/media`, mediaRoutes);
  app.use(`${basePath}/sessions`, sessionRoutes);
  app.use(`${basePath}/whatsapp-auth`, whatsappAuthRoutes);
  app.use(`${basePath}/whatsapp`, whatsappRoutes);
  
  // Serve uploaded files
  app.use('/uploads', (req, res, next) => {
    const uploadPath = path.join(process.cwd(), config.storage.path);
    const options = {
      maxAge: 86400000, // 1 day in milliseconds
      immutable: true,
      lastModified: true
    };
    
    res.sendFile(req.path, { root: uploadPath, ...options }, (err) => {
      if (err) {
        // If file not found, continue to next route
        next();
      }
    });
  });
  
  // Health check endpoint
  app.get(`${basePath}/health`, (req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'Server is running',
      version: process.env.npm_package_version || 'unknown',
      environment: config.server.env
    });
  });

  // Root endpoint
  app.get('/', (req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'WaySpeak WhatsApp API Platform',
      apiVersion
    });
  });
  
  // Catch all unknown routes
  app.all('*', (req, res) => {
    res.status(404).json({
      status: 'error',
      message: `Cannot find ${req.method} ${req.originalUrl} on this server`
    });
  });
}