const express = require('express');
const router = express.Router();
const { createTeam, addPlayers, getAllTeams, getMyCaptainTeam } = require('../controllers/teamController');
const { protect, captainOnly } = require('../middleware/authMiddleware');

router.get('/', getAllTeams);
router.get('/my', protect, captainOnly, getMyCaptainTeam);
router.post('/', protect, captainOnly, createTeam);
router.put('/:id/players', protect, captainOnly, addPlayers);

module.exports = router;
