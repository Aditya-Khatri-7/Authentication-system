import express from 'express';
import profileController from '../controllers/profileController.js';
import { verifyJWT } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get current logged-in user profile
router.get('/', verifyJWT, profileController.getProfile);

// Update general profile details
router.patch('/', verifyJWT, profileController.updateProfile);

// Update avatar URL path
router.patch('/avatar', verifyJWT, profileController.updateAvatar);

// Update configuration preferences settings
router.patch('/preferences', verifyJWT, profileController.updatePreferences);

export default router;
