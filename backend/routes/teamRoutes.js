const express = require('express');
const router = express.Router();
const { createTeam, addPlayers } = require('../controllers/teamController');
const { protect, captainOnly } = require('../middleware/authMiddleware');

router.post('/', protect, captainOnly, createTeam);
router.put('/:id/players', protect, captainOnly, addPlayers);

module.exports = router;
