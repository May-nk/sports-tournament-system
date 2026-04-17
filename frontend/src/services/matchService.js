import api from './api';

export const getMatches = (tournamentId) =>
  api.get(`/matches/${tournamentId}`);

export const updateScore = (matchId, { scoreA, scoreB }, token) =>
  api.put(
    `/matches/${matchId}/score`,
    { scoreA, scoreB },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
