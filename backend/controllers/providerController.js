import Provider from '../models/Provider.js';
import Service from '../models/Service.js';

// @desc    Add a Service
// @route   POST /api/providers/service
// @access  Private (Provider only)
export const addService = async (req, res) => {
  const { name, price, duration } = req.body;

  try {
    const provider = await Provider.findOne({ userId: req.user._id });

    if (!provider) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    const service = await Service.create({
      providerId: provider._id,
      name,
      price,
      duration,
    });

    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Schedule
// @route   PUT /api/providers/schedule
// @access  Private (Provider only)
export const updateSchedule = async (req, res) => {
  const { schedule } = req.body; // Expects object with keys like "Monday", "Tuesday" etc.

  try {
    const provider = await Provider.findOne({ userId: req.user._id });

    if (!provider) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    // Merge new schedule into existing
    provider.schedule = { ...provider.schedule, ...schedule };
    await provider.save();

    res.json(provider.schedule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Provider Profile (Public)
// @route   GET /api/providers/:id
// @access  Public
export const getProviderProfile = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id).populate('userId', 'name email phone');

    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    const services = await Service.find({ providerId: provider._id });

    res.json({ provider, services });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get All Providers with Services
// @route   GET /api/providers
// @access  Public
export const getProviders = async (req, res) => {
    try {
        const providers = await Provider.find().populate('userId', 'name');
        
        // Fetch services for each provider
        const providersWithServices = await Promise.all(providers.map(async (p) => {
            const services = await Service.find({ providerId: p._id }).select('name');
            return {
                ...p.toObject(),
                services // Array of service objects { _id, name }
            };
        }));

        res.json(providersWithServices);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// @desc    Get Current Provider Profile (Private)
// @route   GET /api/providers/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const provider = await Provider.findOne({ userId: req.user._id }).populate('userId', 'name email phone');
    if (!provider) {
       return res.status(404).json({ message: 'Provider profile not found' });
    }
    const services = await Service.find({ providerId: provider._id });
    res.json({ provider, services });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Update Provider Profile (Bio & Schedule)
// @route   PUT /api/providers/profile
// @access  Private
export const updateProfile = async (req, res) => {
  const { bio, schedule } = req.body;

  try {
    const provider = await Provider.findOne({ userId: req.user._id });
    if (!provider) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    if (bio !== undefined) provider.bio = bio;
    if (schedule !== undefined) provider.schedule = { ...provider.schedule, ...schedule };

    await provider.save();
    res.json(provider);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
