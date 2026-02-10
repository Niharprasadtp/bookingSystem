import mongoose from 'mongoose';

const dayScheduleSchema = new mongoose.Schema({
  startTime: { type: String, default: "09:00" }, // 24h format
  endTime: { type: String, default: "18:00" },
  isDayOff: { type: Boolean, default: false }
}, { _id: false });

const providerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bio: { type: String },
  schedule: {
    Monday: { type: dayScheduleSchema, default: () => ({}) },
    Tuesday: { type: dayScheduleSchema, default: () => ({}) },
    Wednesday: { type: dayScheduleSchema, default: () => ({}) },
    Thursday: { type: dayScheduleSchema, default: () => ({}) },
    Friday: { type: dayScheduleSchema, default: () => ({}) },
    Saturday: { type: dayScheduleSchema, default: () => ({ isDayOff: true }) },
    Sunday: { type: dayScheduleSchema, default: () => ({ isDayOff: true }) }
  }
}, { timestamps: true });

export default mongoose.model('Provider', providerSchema);