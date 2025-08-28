// routes/index.js
import express from 'express';
// Route files
import authRoutes from './auth.route.js';
import userRoutes from './user.route.js';
import messageRoutes from './message.route.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/messages', messageRoutes);

export default router;