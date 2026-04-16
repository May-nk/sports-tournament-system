const TeamTournament = require('../models/TeamTournament');
const Team = require('../models/Team');
const Tournament = require('../models/Tournament');

// @desc    Captain applies to tournament
// @route   POST /api/team-tournaments/apply
// @access  Private/Captain
const applyToTournament = async (req, res) => {
  try {
    const { tournamentId } = req.body;

    if (!tournamentId) {
      return res.status(400).json({ message: 'Please provide tournamentId' });
    }

    // Get the team of the current captain
    const team = await Team.findOne({ captain: req.user._id });
    if (!team) {
      return res.status(404).json({ message: 'You do not have a team to register. Please create one first.' });
    }

    // Ensure tournament exists
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    // Prevent duplicate application
    const existingApplication = await TeamTournament.findOne({
      team: team._id,
      tournament: tournamentId
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'Team has already applied to this tournament' });
    }

    // Create application
    const application = await TeamTournament.create({
      team: team._id,
      tournament: tournamentId,
      status: 'pending', // Explicit default
    });

    res.status(201).json(application);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin approves a team application
// @route   PUT /api/team-tournaments/:id/approve
// @access  Private/Admin
const approveTeam = async (req, res) => {
  try {
    const applicationId = req.params.id;

    const application = await TeamTournament.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    application.status = 'approved';
    await application.save();

    res.status(200).json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin rejects a team application
// @route   PUT /api/team-tournaments/:id/reject
// @access  Private/Admin
const rejectTeam = async (req, res) => {
  try {
    const applicationId = req.params.id;

    const application = await TeamTournament.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    application.status = 'rejected';
    await application.save();

    res.status(200).json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all teams for a tournament alongside their status
// @route   GET /api/team-tournaments/:tournamentId
// @access  Public
const getTeamsOfTournament = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const teams = await TeamTournament.find({ tournament: tournamentId })
      .populate('team', 'name players')
      .populate('tournament', 'name sport'); 

    res.status(200).json(teams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  applyToTournament,
  approveTeam,
  rejectTeam,
  getTeamsOfTournament
};
