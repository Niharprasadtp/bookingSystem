import express from 'express';
import { createAppointment } from '../controllers/appointmentController.js';
import { getAvailableSlots } from '../controllers/slotController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/slots', getAvailableSlots); // Public or Protected? Usually public to see availability
router.post('/book', protect, createAppointment);

export default router;

