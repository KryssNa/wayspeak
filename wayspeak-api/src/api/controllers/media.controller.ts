// src/api/controllers/media.controller.ts

import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { AppError } from '../../utils/errors/app-error';
import logger from '../../utils/logging/logger';
import config from '../../config';

export class MediaController {
  async uploadMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // req.file is set by multer
      if (!req.file) {
        return next(AppError.badRequest('No file uploaded'));
      }

      // Create full URL for the uploaded file
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

      // Add user ID to the response for tracking
      const userId = req.user._id.toString();

      res.status(201).json({
        status: 'success',
        data: {
          fileUrl,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          userId
        }
      });
    } catch (error) {
      logger.error('Error uploading media', { error });
      next(error);
    }
  }

  async getMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const uploadDir = path.resolve(process.cwd(), config.storage.path);
      const filePath = path.join(uploadDir, id);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return next(AppError.notFound(`File with ID ${id} not found`));
      }

      // Get file details
      const stats = fs.statSync(filePath);
      const fileExtension = path.extname(id).substring(1);
      const mimeType = this.getMimeType(fileExtension);

      // Set headers
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Content-Disposition', `inline; filename=${id}`);

      // Stream file to response
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      logger.error('Error fetching media', { error });
      next(error);
    }
  }

  private getMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'pdf': 'application/pdf',
      'mp3': 'audio/mpeg',
      'mp4': 'video/mp4',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain'
    };

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }
}

export const mediaController = new MediaController();