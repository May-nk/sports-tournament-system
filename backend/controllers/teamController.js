const Team = require('../models/Team');

// @desc    Create a new team
// @route   POST /api/teams
// @access  Private/Captain
const createTeam = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Please provide a team name' });
    }

    // Check if captain already has a team
    const existingTeam = await Team.findOne({ captain: req.user._id });
    if (existingTeam) {
      return res.status(400).json({ message: 'You already have a team' });
    }

    // Create team
    const team = await Team.create({
      name,
      captain: req.user._id,
      players: [],
    });

    res.status(201).json(team);
  } catch (error) {
    if (error.code === 11000) { // Mongo duplicate key error index
      return res.status(400).json({ message: 'Team name is already taken' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add players to a team
// @route   PUT /api/teams/:id/players
// @access  Private/Captain
const addPlayers = async (req, res) => {
  try {
    const { players } = req.body;
    const teamId = req.params.id;

    if (!players || !Array.isArray(players) || players.length === 0) {
       return res.status(400).json({ message: 'Please provide an array of players' });
    }

    // Find the team
    const team = await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Ensure the requester is the actual captain of this team
    if (team.captain.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to add players to this team' });
    }

    // Validate inner player objects
    const invalidPlayer = players.find(p => !p.name || typeof p.age !== 'number' || !p.position);
    if (invalidPlayer) {
       return res.status(400).json({ message: 'Each player must have a name, age (number), and position' });
    }

    // Add players and save
    team.players.push(...players);
    await team.save();

    res.status(200).json(team);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTeam,
  addPlayers,
};
