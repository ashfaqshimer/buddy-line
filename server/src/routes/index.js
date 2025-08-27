// routes/index.js
import express from 'express';
// Route files
import authRoutes from './auth.route.js';


const router = express.Router();

router.use('/auth', authRoutes);

export default router;