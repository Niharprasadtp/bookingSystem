import Provider from '../models/Provider.js';
import Service from '../models/Service.js';
import Appointment from '../models/Appointment.js';

const getMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const formatTime = (minutes) => {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

export const getAvailableSlots = async (req, res) => {
  const { providerId, serviceId, date } = req.query;

  if (!providerId || !serviceId || !date) {
    return res.status(400).json({ message: 'Missing parameters' });
  }

  try {
    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ message: 'Service not found' });

    const provider = await Provider.findById(providerId);
    if (!provider) return res.status(404).json({ message: 'Provider not found' });

    const bookingDate = new Date(date);
    const dayOfWeek = bookingDate.toLocaleString('en-US', { weekday: 'long' });
    const schedule = provider.schedule[dayOfWeek];

    if (!schedule || schedule.isDayOff) {
      return res.json([]);
    }

    // Set time range for the selected day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch active appointments for the day
    const appointments = await Appointment.find({
      providerId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'cancelled' }
    }).populate('serviceId');

    // Convert existing appointments to minute ranges
    const busyIntervals = appointments.map(appt => {
      const start = getMinutes(appt.slotTime);
      const duration = appt.serviceId ? appt.serviceId.duration : 30;
      return { start, end: start + duration };
    });

    const availableSlots = [];
    const serviceDuration = service.duration;
    let currentSlotStart = getMinutes(schedule.startTime);
    const dayEndTime = getMinutes(schedule.endTime);

    const now = new Date();
    const isToday = bookingDate.toDateString() === now.toDateString();
    const currentMinutesNow = now.getHours() * 60 + now.getMinutes();

    while (currentSlotStart + serviceDuration <= dayEndTime) {
      const slotEnd = currentSlotStart + serviceDuration;

      // Skip past times if booking for today
      if (isToday && currentSlotStart <= currentMinutesNow) {
        currentSlotStart += 30;
        continue;
      }

      // Check for overlap with existing appointments
      const isBusy = busyIntervals.some(busy => {
        return (currentSlotStart < busy.end && slotEnd > busy.start);
      });

      if (!isBusy) {
        availableSlots.push(formatTime(currentSlotStart));
      }

      currentSlotStart += 30;
    }

    res.json(availableSlots);

  } catch (error) {
    console.error('Error calculating slots:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};