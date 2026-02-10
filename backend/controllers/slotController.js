import Provider from '../models/Provider.js';
import Service from '../models/Service.js';
import Appointment from '../models/Appointment.js';

// Helper to calculate minutes from "HH:MM"
const getMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper to format minutes back to "HH:MM"
const formatTime = (minutes) => {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

export const getAvailableSlots = async (req, res) => {
  const { providerId, serviceId, date } = req.query; // date in YYYY-MM-DD format

  if (!providerId || !serviceId || !date) {
    return res.status(400).json({ message: 'Missing required parameters' });
  }

  try {
    // 1. Fetch Provider and Schedule
    const provider = await Provider.findById(providerId);
    if (!provider) return res.status(404).json({ message: 'Provider not found' });

    const dayOfWeek = new Date(date).toLocaleString('en-US', { weekday: 'long' });
    const schedule = provider.schedule[dayOfWeek];

    // 2. Check if Day Off
    if (!schedule || schedule.isDayOff) {
      return res.json([]); // Return empty if day off
    }

    // 3. Fetch Service Duration
    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    
    const serviceDuration = service.duration;

    // 4. Fetch Existing Appointments
    // We need to match appointments on that specific DATE
    // Assuming 'date' in Appointment model matches the YYYY-MM-DD part or is a full object
    // For simplicity, let's assume we query by range of that day
    const startOfDay = new Date(date);
    startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23,59,59,999);

    const appointments = await Appointment.find({
      providerId: providerId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: { $ne: 'cancelled' } // Don't count cancelled
    });

    // 5. Generate Slots Loop
    const availSlots = [];
    let currentMinutes = getMinutes(schedule.startTime);
    const endMinutes = getMinutes(schedule.endTime);

    while (currentMinutes + serviceDuration <= endMinutes) {
      const slotStart = currentMinutes;
      const slotEnd = currentMinutes + serviceDuration;

      // Check collision
      const isBooked = appointments.some(appt => {
        const apptStart = getMinutes(appt.slotTime);
        // We need the service duration of the APPOINTMENT to know when it ends
        // BUT, the appointment model stores serviceId. 
        // OPTIMIZATION: We should probably store duration or endTime in Appointment for easier lookup.
        // For now, we will assume we need to fetch that service, OR (better for this specific MVP request limits)
        // we can cheat slightly if we don't assume variable durations for *other* slots, 
        // OR we just populate service in the query.
        
        // Let's populate service to get duration of existing appointments
        return false; // Will fix inside loop with populated data
      });
      
      // Let's Fetch appointments WITH populated service to get duration
      // Since we can't do async inside .some easily without fetching all first.
      
      // Re-fetch appointments with service populated
      const appointmentsWithService = await Appointment.find({
        providerId: providerId,
        date: {
          $gte: startOfDay,
          $lte: endOfDay
        },
        status: { $ne: 'cancelled' }
      }).populate('serviceId');

      const isOverlapping = appointmentsWithService.some(appt => {
        const apptStart = getMinutes(appt.slotTime);
        const apptDuration = appt.serviceId.duration;
        const apptEnd = apptStart + apptDuration;

        // Overlap logic: (StartA < EndB) and (EndA > StartB)
        return (slotStart < apptEnd && slotEnd > apptStart);
      });

      if (!isOverlapping) {
        availSlots.push(formatTime(slotStart));
      }

      // Step: 30 minutes
      currentMinutes += 30;
    }

    res.json(availSlots);
  } catch (error) {
     console.error(error);
     res.status(500).json({ message: error.message });
  }
};
