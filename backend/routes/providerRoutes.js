import express from 'express';
import { addService, updateSchedule, getProviderProfile, getProviders } from '../controllers/providerController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getProviders);
router.get('/:id', getProviderProfile);
router.post('/service', protect, addService); // Add middleware to check role=provider ideally
router.put('/schedule', protect, updateSchedule);

export default router;

