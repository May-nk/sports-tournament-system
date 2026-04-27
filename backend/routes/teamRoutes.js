const express = require('express');
const router = express.Router();
const { createTeam, addPlayers, getAllTeams, getMyCaptainTeam, editPlayer, removePlayer } = require('../controllers/teamController');
const { protect, captainOnly } = require('../middleware/authMiddleware');

router.get('/', getAllTeams);
router.get('/my', protect, captainOnly, getMyCaptainTeam);
router.post('/', protect, captainOnly, createTeam);
router.put('/:id/players', protect, captainOnly, addPlayers);
router.put('/:id/players/:playerId', protect, captainOnly, editPlayer);
router.delete('/:id/players/:playerId', protect, captainOnly, removePlayer);

module.exports = router;
