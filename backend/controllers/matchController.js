const Match = require('../models/Match');
const TeamTournament = require('../models/TeamTournament');

// @desc    Create a new match
// @route   POST /api/matches
// @access  Private/Admin
const createMatch = async (req, res) => {
  try {
    const { tournamentId, teamA, teamB, date, venue, round } = req.body;

    if (!tournamentId || !teamA || !teamB || !date || !venue) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (teamA === teamB) {
      return res.status(400).json({ message: 'teamA and teamB cannot be the same team' });
    }

    // Check if both teams are approved in the tournament
    const teamAStatus = await TeamTournament.findOne({ tournament: tournamentId, team: teamA, status: 'approved' });
    const teamBStatus = await TeamTournament.findOne({ tournament: tournamentId, team: teamB, status: 'approved' });

    if (!teamAStatus || !teamBStatus) {
      return res.status(400).json({ message: 'Both teams must be officially approved for this tournament before scheduling a match' });
    }

    // Create Match
    const match = await Match.create({
      tournament: tournamentId,
      teamA,
      teamB,
      date,
      venue,
      round, // optional round field passed through
      status: 'scheduled',
      scoreA: 0,
      scoreB: 0,
    });

    res.status(201).json(match);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get matches by tournament
// @route   GET /api/matches/:tournamentId
// @access  Public
const getTournamentMatches = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const matches = await Match.find({ tournament: tournamentId })
      .populate('teamA', 'name')
      .populate('teamB', 'name')
      .populate('winner', 'name')
      .populate('tournament', 'name sport'); // Helpful to see the tournament reference

    res.status(200).json(matches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update match score and mark completed
// @route   PUT /api/matches/:id/score
// @access  Private/Admin
const updateScore = async (req, res) => {
  try {
    const matchId = req.params.id;
    const { scoreA, scoreB } = req.body;

    if (scoreA === undefined || scoreB === undefined) {
      return res.status(400).json({ message: 'Please provide both scoreA and scoreB' });
    }

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Update Scores securely
    match.scoreA = scoreA;
    match.scoreB = scoreB;
    match.status = 'completed';

    // Verify winner based strictly on scores
    if (scoreA > scoreB) {
      match.winner = match.teamA;
    } else if (scoreB > scoreA) {
      match.winner = match.teamB;
    } else {
      match.winner = null; // Defined as a Draw
    }

    await match.save();

    // Update TeamTournament leaderboard stats
    const [entryA, entryB] = await Promise.all([
      TeamTournament.findOne({ tournament: match.tournament, team: match.teamA }),
      TeamTournament.findOne({ tournament: match.tournament, team: match.teamB }),
    ]);

    if (entryA && entryB) {
      if (scoreA > scoreB) {
        // teamA wins
        entryA.points += 2;
        entryA.wins += 1;
        entryB.losses += 1;
      } else if (scoreB > scoreA) {
        // teamB wins
        entryB.points += 2;
        entryB.wins += 1;
        entryA.losses += 1;
      } else {
        // Draw
        entryA.points += 1;
        entryA.draws += 1;
        entryB.points += 1;
        entryB.draws += 1;
      }

      await Promise.all([entryA.save(), entryB.save()]);
    }

    res.status(200).json(match);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createMatch,
  getTournamentMatches,
  updateScore
};
