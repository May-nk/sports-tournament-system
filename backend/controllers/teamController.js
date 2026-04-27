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

// @desc    Get the captain's own team
// @route   GET /api/teams/my
// @access  Private/Captain
const getMyCaptainTeam = async (req, res) => {
  try {
    const team = await Team.findOne({ captain: req.user._id })
      .populate('captain', 'name email')
      .select('name captain players createdAt');

    if (!team) {
      return res.status(404).json({ message: 'You do not have a team yet.' });
    }

    res.status(200).json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all teams with players
// @route   GET /api/teams
// @access  Public
const getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find()
      .populate('captain', 'name email')
      .select('name captain players createdAt');

    res.status(200).json(teams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Edit a player in a team
// @route   PUT /api/teams/:id/players/:playerId
// @access  Private/Captain
const editPlayer = async (req, res) => {
  try {
    const { name, age, position } = req.body;
    const teamId = req.params.id;
    const playerId = req.params.playerId;

    if (!name || typeof age !== 'number' || !position) {
      return res.status(400).json({ message: 'Please provide name, age (number), and position' });
    }

    const team = await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (team.captain.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit players in this team' });
    }

    console.log(`[editPlayer] Searching for player ${playerId} in team ${teamId}`);
    const player = team.players.find(p => p._id && p._id.toString() === playerId.toString());
    
    if (!player) {
      console.log(`[editPlayer] Player ${playerId} not found in team.players array!`);
      return res.status(404).json({ message: 'Player not found' });
    }

    player.name = name;
    player.age = age;
    player.position = position;

    await team.save();
    console.log(`[editPlayer] Successfully updated player ${playerId}`);

    res.status(200).json(team);
  } catch (error) {
    console.error(`[editPlayer] ERROR:`, error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove a player from a team
// @route   DELETE /api/teams/:id/players/:playerId
// @access  Private/Captain
const removePlayer = async (req, res) => {
  try {
    const teamId = req.params.id;
    const playerId = req.params.playerId;

    const team = await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (team.captain.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to remove players from this team' });
    }

    console.log(`[removePlayer] Searching for player ${playerId} in team ${teamId}`);
    const playerIndex = team.players.findIndex(p => p._id && p._id.toString() === playerId.toString());
    if (playerIndex === -1) {
      console.log(`[removePlayer] Player ${playerId} not found in team.players array!`);
      return res.status(404).json({ message: 'Player not found' });
    }

    team.players.splice(playerIndex, 1);
    await team.save();
    console.log(`[removePlayer] Successfully removed player ${playerId}`);

    res.status(200).json(team);
  } catch (error) {
    console.error(`[removePlayer] ERROR:`, error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTeam,
  addPlayers,
  getAllTeams,
  getMyCaptainTeam,
  editPlayer,
  removePlayer,
};
