const Match = require('../models/Match');
const TeamTournament = require('../models/TeamTournament');

// @desc    Create a new match
// @route   POST /api/matches
// @access  Private/Admin
const createMatch = async (req, res) => {
  try {
    const { tournamentId, teamA, teamB, date, matchDate, venue, round, status } = req.body;

    if (!tournamentId || !teamA || !teamB || (!date && !matchDate) || !venue) {
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
    const finalDate = matchDate || date;
    const match = await Match.create({
      tournament: tournamentId,
      teamA,
      teamB,
      date: finalDate,
      matchDate: finalDate,
      venue,
      round, // optional round field passed through
      status: status || 'Scheduled',
      scoreA: 0,
      scoreB: 0,
      team1Score: 0,
      team2Score: 0,
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

// @desc    Get a single match by ID
// @route   GET /api/matches/detail/:id
// @access  Public
const getMatchById = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('teamA', 'name')
      .populate('teamB', 'name')
      .populate('winner', 'name')
      .populate('tossWinner', 'name')
      .populate('tournament', 'name sport type');

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }
    res.status(200).json(match);
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
    const updates = req.body;
    const { scoreA, scoreB, status, winner } = updates;

    // Validation for new fields as requested
    if (updates.team1Score !== undefined && isNaN(Number(updates.team1Score))) return res.status(400).json({ message: 'Scores must be numbers' });
    if (updates.team2Score !== undefined && isNaN(Number(updates.team2Score))) return res.status(400).json({ message: 'Scores must be numbers' });
    if (updates.team1Wickets !== undefined && (updates.team1Wickets < 0 || updates.team1Wickets > 10)) return res.status(400).json({ message: 'Wickets must be between 0 and 10' });
    if (updates.team2Wickets !== undefined && (updates.team2Wickets < 0 || updates.team2Wickets > 10)) return res.status(400).json({ message: 'Wickets must be between 0 and 10' });
    if (updates.team1Overs !== undefined && updates.team1Overs < 0) return res.status(400).json({ message: 'Overs must be positive' });
    if (updates.team2Overs !== undefined && updates.team2Overs < 0) return res.status(400).json({ message: 'Overs must be positive' });
    
    if (status !== undefined && !['Scheduled', 'Live', 'Completed', 'scheduled', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Status must be Scheduled, Live, or Completed' });
    }

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const wasCompleted = match.status === 'completed' || match.status === 'Completed';

    // Apply basic updates
    if (scoreA !== undefined) match.scoreA = scoreA;
    if (scoreB !== undefined) match.scoreB = scoreB;
    if (updates.team1Score !== undefined) { match.team1Score = updates.team1Score; match.scoreA = updates.team1Score; }
    if (updates.team2Score !== undefined) { match.team2Score = updates.team2Score; match.scoreB = updates.team2Score; }
    
    if (updates.team1Wickets !== undefined) match.team1Wickets = updates.team1Wickets;
    if (updates.team2Wickets !== undefined) match.team2Wickets = updates.team2Wickets;
    if (updates.team1Overs !== undefined) match.team1Overs = updates.team1Overs;
    if (updates.team2Overs !== undefined) match.team2Overs = updates.team2Overs;
    
    if (updates.team1TopScorer !== undefined) match.team1TopScorer = updates.team1TopScorer;
    if (updates.team1TopScore !== undefined) match.team1TopScore = updates.team1TopScore;
    if (updates.team2TopScorer !== undefined) match.team2TopScorer = updates.team2TopScorer;
    if (updates.team2TopScore !== undefined) match.team2TopScore = updates.team2TopScore;
    
    if (updates.resultText !== undefined) match.resultText = updates.resultText;
    if (updates.playerOfMatch !== undefined) match.playerOfMatch = updates.playerOfMatch;
    if (updates.matchSummary !== undefined) match.matchSummary = updates.matchSummary;
    if (updates.tossWinner !== undefined) match.tossWinner = updates.tossWinner;
    if (updates.electedTo !== undefined) match.electedTo = updates.electedTo;

    // Backward compatibility: if purely scoreA/scoreB update without explicit status, assume completion
    let finalStatus = status || match.status;
    if (status === undefined && scoreA !== undefined && scoreB !== undefined) {
      finalStatus = 'completed';
    }
    match.status = finalStatus;

    const isNowCompleted = finalStatus === 'completed' || finalStatus === 'Completed';

    // Winner logic
    if (winner !== undefined) {
      match.winner = winner;
    } else if (isNowCompleted && scoreA !== undefined && scoreB !== undefined) {
      // Legacy winner logic
      if (match.scoreA > match.scoreB) match.winner = match.teamA;
      else if (match.scoreB > match.scoreA) match.winner = match.teamB;
      else match.winner = null;
    }

    await match.save();

    // Update TeamTournament leaderboard stats only if newly completed
    if (!wasCompleted && isNowCompleted) {
      const [entryA, entryB] = await Promise.all([
        TeamTournament.findOne({ tournament: match.tournament, team: match.teamA }),
        TeamTournament.findOne({ tournament: match.tournament, team: match.teamB }),
      ]);

      if (entryA && entryB) {
        if (match.scoreA > match.scoreB) {
          entryA.points += 2;
          entryA.wins += 1;
          entryB.losses += 1;
        } else if (match.scoreB > match.scoreA) {
          entryB.points += 2;
          entryB.wins += 1;
          entryA.losses += 1;
        } else {
          entryA.points += 1;
          entryA.draws += 1;
          entryB.points += 1;
          entryB.draws += 1;
        }

        await Promise.all([entryA.save(), entryB.save()]);
      }
    }

    res.status(200).json(match);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createMatch,
  getTournamentMatches,
  getMatchById,
  updateScore
};
