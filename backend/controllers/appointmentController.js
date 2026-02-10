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

import Provider from '../models/Provider.js';

// @desc    Get My Appointments
// @route   GET /api/appointments/my-appointments
// @access  Private
export const getMyAppointments = async (req, res) => {
  try {
    let filter = [{ userId: req.user._id }];
    const provider = await Provider.findOne({ userId: req.user._id });
    if(provider) {
        filter.push({ providerId: provider._id });
    }
    
    const appointments = await Appointment.find({ $or: filter })
        .populate('userId', 'name email')
        .populate({
            path: 'providerId',
            populate: { path: 'userId', select: 'name email' }
        })
        .populate('serviceId', 'name price duration')
        .sort({ date: 1, slotTime: 1 });
        
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel Appointment
// @route   PUT /api/appointments/:id/cancel
// @access  Private
export const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    // Check ownership
    // User can cancel their own. Provider can cancel appointments booked with them.
    const provider = await Provider.findOne({ userId: req.user._id });
    
    // We need to compare strings or use .equals() if ObjectId
    const isOwner = appointment.userId.toString() === req.user._id.toString();
    const isProvider = provider && appointment.providerId.toString() === provider._id.toString();
    
    if (!isOwner && !isProvider) {
        return res.status(401).json({ message: 'Not authorized' });
    }

    appointment.status = 'cancelled';
    await appointment.save();
    res.json({ message: 'Appointment cancelled', appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Appointment Status (Accept/Reject)
// @route   PUT /api/appointments/:id/status
// @access  Private (Provider)
export const updateAppointmentStatus = async (req, res) => {
  const { status } = req.body; // 'confirmed' or 'cancelled'
  
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    // Validate ownership (Provider only for accepting)
    const provider = await Provider.findOne({ userId: req.user._id });
    if (!provider || appointment.providerId.toString() !== provider._id.toString()) {
        return res.status(401).json({ message: 'Not authorized to manage this appointment' });
    }

    if (!['confirmed', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    appointment.status = status;
    await appointment.save();
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
