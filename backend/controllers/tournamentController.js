const Tournament = require('../models/Tournament');

// @desc    Create a new tournament
// @route   POST /api/tournaments
// @access  Private/Admin
const createTournament = async (req, res) => {
  try {
    const { name, sport, format, startDate, endDate } = req.body;

    // Validate required fields
    if (!name || !sport || !format || !startDate || !endDate) {
      return res.status(400).json({ message: 'Please add all required fields' });
    }

    if (!['league', 'knockout'].includes(format)) {
       return res.status(400).json({ message: 'Format must be league or knockout' });
    }

    // Create tournament
    const tournament = await Tournament.create({
      name,
      sport,
      format,
      startDate,
      endDate,
      status: 'upcoming', // Ensure default status is set explicitly
    });

    res.status(201).json(tournament);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all tournaments
// @route   GET /api/tournaments
// @access  Public
const getTournaments = async (req, res) => {
  try {
    const tournaments = await Tournament.find({});
    res.status(200).json(tournaments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTournament,
  getTournaments,
};
