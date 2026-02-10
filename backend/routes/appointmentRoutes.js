import express from 'express';
import { createAppointment, getMyAppointments, cancelAppointment, updateAppointmentStatus } from '../controllers/appointmentController.js';
import { getAvailableSlots } from '../controllers/slotController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/slots', getAvailableSlots); 
router.get('/my-appointments', protect, getMyAppointments);
router.post('/book', protect, createAppointment);
router.put('/:id/cancel', protect, cancelAppointment);
router.put('/:id/status', protect, updateAppointmentStatus);

export default router;

