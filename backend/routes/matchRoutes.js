const express = require('express');
const router = express.Router();
const {
  createMatch,
  getTournamentMatches,
  getMatchById,
  updateScore
} = require('../controllers/matchController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/', protect, adminOnly, createMatch);
router.get('/detail/:id', getMatchById);
router.get('/:tournamentId', getTournamentMatches);
router.put('/:id/score', protect, adminOnly, updateScore);

module.exports = router;
