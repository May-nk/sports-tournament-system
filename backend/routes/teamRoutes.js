const express = require('express');
const router = express.Router();
const { createTeam, addPlayers, getAllTeams } = require('../controllers/teamController');
const { protect, captainOnly } = require('../middleware/authMiddleware');

router.get('/', getAllTeams);
router.post('/', protect, captainOnly, createTeam);
router.put('/:id/players', protect, captainOnly, addPlayers);

module.exports = router;
