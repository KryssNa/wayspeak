// src/api/routes/media.routes.ts

import { Router } from 'express';
import { mediaController } from '../controllers/media.controller';
import { authenticate } from '../middlewares/auth.middleware';
import upload, { handleMulterError } from '../middlewares/upload.middleware';

const router: Router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Upload media
router.post(
  '/upload',
  upload.single('file'),
  handleMulterError,
  mediaController.uploadMedia.bind(mediaController)
);

// Get media by ID (if needed)
router.get('/:id', mediaController.getMedia.bind(mediaController));

export default router;