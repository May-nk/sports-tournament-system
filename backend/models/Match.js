const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
  {
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
    },
    teamA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    teamB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    scoreA: {
      type: Number,
      default: 0,
    },
    scoreB: {
      type: Number,
      default: 0,
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
    },
    date: {
      type: Date,
      required: true,
    },
    venue: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'Scheduled', 'Live', 'Completed'],
      default: 'Scheduled',
    },
    round: {
      type: String,
    },
    // Phase 1: Cricket Match Center fields
    matchDate: {
      type: Date,
    },
    tossWinner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    electedTo: {
      type: String,
      enum: ['Bat', 'Bowl'],
      default: null,
    },
    resultText: {
      type: String,
      default: '',
    },
    playerOfMatch: {
      type: String,
      default: '',
    },
    // Team 1 Scorecard
    team1Score: {
      type: Number,
      default: 0,
    },
    team1Wickets: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    team1Overs: {
      type: Number,
      default: 0,
      min: 0,
    },
    team1TopScorer: {
      type: String,
      default: '',
    },
    team1TopScore: {
      type: Number,
      default: 0,
    },
    // Team 2 Scorecard
    team2Score: {
      type: Number,
      default: 0,
    },
    team2Wickets: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    team2Overs: {
      type: Number,
      default: 0,
      min: 0,
    },
    team2TopScorer: {
      type: String,
      default: '',
    },
    team2TopScore: {
      type: Number,
      default: 0,
    },
    // Match Summary
    matchSummary: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Match = mongoose.model('Match', matchSchema);

module.exports = Match;
