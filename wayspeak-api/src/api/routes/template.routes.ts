// src/api/routes/template.routes.ts

import { Router } from 'express';
import { templateController } from '../controllers/template.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router:Router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Create a new template
router.post('/', templateController.createTemplate.bind(templateController));

// Get all templates for the authenticated user
router.get('/', templateController.getTemplates.bind(templateController));

// Get a specific template by id
router.get('/:id', templateController.getTemplate.bind(templateController));

// Update a template
router.put('/:id', templateController.updateTemplate.bind(templateController));

// Delete a template
router.delete('/:id', templateController.deleteTemplate.bind(templateController));

// Preview a template with variables
router.post('/preview', templateController.previewTemplate.bind(templateController));

// Duplicate a template
router.post('/:id/duplicate', templateController.duplicateTemplate.bind(templateController));

export default router;