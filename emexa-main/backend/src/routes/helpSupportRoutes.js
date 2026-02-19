// backend/src/routes/helpSupportRoutes.js
import express from 'express';
import * as helpSupportController from '../controllers/helpSupportController.js';
import { protect } from '../middleware/auth.js'; // Your auth middleware

const router = express.Router();

// Public routes (no authentication required)
router.get('/articles', helpSupportController.getHelpArticles);
router.get('/articles/:id', helpSupportController.getHelpArticle);
router.get('/articles/category/:category', helpSupportController.getArticlesByCategory);
router.get('/faqs', helpSupportController.getFAQs);
router.get('/search', helpSupportController.searchHelp);
router.get('/system-status', helpSupportController.getSystemStatus);

// Protected routes (authentication required)
router.use(protect); // Apply authentication middleware to all routes below

// Support tickets
router.post('/contact', helpSupportController.submitSupportTicket);
router.get('/tickets', helpSupportController.getUserTickets);

// Feedback
router.post('/articles/:id/helpful', helpSupportController.markArticleHelpful);

export default router;