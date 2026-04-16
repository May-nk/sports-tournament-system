const express = require('express');
const router = express.Router();
const {
  applyToTournament,
  approveTeam,
  rejectTeam,
  getTeamsOfTournament
} = require('../controllers/teamTournamentController');
const { protect, captainOnly, adminOnly } = require('../middleware/authMiddleware');

router.post('/apply', protect, captainOnly, applyToTournament);
router.put('/:id/approve', protect, adminOnly, approveTeam);
router.put('/:id/reject', protect, adminOnly, rejectTeam);
router.get('/:tournamentId', getTeamsOfTournament);

module.exports = router;
