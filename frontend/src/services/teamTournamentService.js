import api from './api';

// GET all applications for a tournament (filter pending on frontend)
export const getTeamsOfTournament = (tournamentId) =>
  api.get(`/team-tournaments/${tournamentId}`);

// PUT approve a team application (admin only)
export const approveTeam = (applicationId, token) =>
  api.put(
    `/team-tournaments/${applicationId}/approve`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

// PUT reject a team application (admin only)
export const rejectTeam = (applicationId, token) =>
  api.put(
    `/team-tournaments/${applicationId}/reject`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
