const express = require('express');
const router = express.Router();
const { createTournament, getTournaments } = require('../controllers/tournamentController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// POST /    -> admin only
// GET /     -> public
router.route('/')
  .post(protect, adminOnly, createTournament)
  .get(getTournaments);

module.exports = router;
