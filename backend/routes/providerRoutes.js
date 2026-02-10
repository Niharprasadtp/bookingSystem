import express from 'express';
import { addService, updateSchedule, getProviderProfile, getProviders, getMe, updateProfile } from '../controllers/providerController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getProviders);
router.get('/me', protect, getMe);
router.get('/:id', getProviderProfile);
router.post('/service', protect, addService); 
router.put('/schedule', protect, updateSchedule);
router.put('/profile', protect, updateProfile);

export default router;

