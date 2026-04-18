import api from './api';

export const getLeaderboard = () => api.get('/leaderboard');

export const getLeaderboardByTournament = (tournamentId) =>
  api.get(`/leaderboard/${tournamentId}`);
