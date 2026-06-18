import api from './api';

export const getMatches = (tournamentId) =>
  api.get(`/matches/${tournamentId}`);

export const getMatchById = (matchId) =>
  api.get(`/matches/detail/${matchId}`);

export const createMatch = ({ tournamentId, teamA, teamB, date, venue }, token) =>
  api.post(
    '/matches',
    { tournamentId, teamA, teamB, date, venue },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

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
