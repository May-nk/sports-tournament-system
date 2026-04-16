const express = require('express');
const router = express.Router();
const { getLeaderboard } = require('../controllers/leaderboardController');

// GET /api/leaderboard/:tournamentId
router.get('/:tournamentId', getLeaderboard);

module.exports = router;
