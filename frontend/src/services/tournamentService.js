import api from './api';

export const getTournaments = () => api.get('/tournaments');

export const createTournament = (data, token) =>
  api.post('/tournaments', data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const applyToTournament = (tournamentId, token) =>
  api.post(
    '/team-tournaments/apply',
    { tournamentId },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
