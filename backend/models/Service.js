import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true },
  name: { type: String, required: true }, // e.g., "Haircut"
  price: { type: Number, required: true },
  duration: { type: Number, required: true } // Duration in minutes, e.g., 30
}, { timestamps: true });

export default mongoose.model('Service', serviceSchema);