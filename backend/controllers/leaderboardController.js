const TeamTournament = require('../models/TeamTournament');

// @desc    Get leaderboard for a tournament
// @route   GET /api/leaderboard/:tournamentId
// @access  Public
const getLeaderboard = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const leaderboard = await TeamTournament.find({ tournament: tournamentId })
      .populate('team', 'name')
      .lean();

    // Sort: points desc, then wins desc
    leaderboard.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.wins - a.wins;
    });

    res.status(200).json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getLeaderboard };
