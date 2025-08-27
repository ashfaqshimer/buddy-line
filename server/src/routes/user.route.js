import express from 'express';
import { getMe, updateProfile, deleteAccount } from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes in this file are protected
router.use(protect);

router.get('/me', getMe);
router.put('/profile', updateProfile);
router.delete('/me', deleteAccount);

export default router;