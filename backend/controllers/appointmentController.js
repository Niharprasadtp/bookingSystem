import Appointment from '../models/Appointment.js';
import Service from '../models/Service.js';

// @desc    Book an Appointment
// @route   POST /api/appointments/book
// @access  Private
export const createAppointment = async (req, res) => {
  const { providerId, serviceId, date, slotTime } = req.body;

  try {
    // 1. Validate service existence
    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ message: 'Service not found' });

    // 2. Create Appointment
    const appointment = await Appointment.create({
      userId: req.user._id,
      providerId,
      serviceId,
      date,
      slotTime,
      paymentStatus: 'pending' // Default
    });

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

