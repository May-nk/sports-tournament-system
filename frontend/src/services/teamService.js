import api from "./api";

export const createTeam = (data, token) => {
  return api.post("/teams", data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getTeams = () => api.get("/teams");

// Returns the captain's own team (requires captain role + token)
export const getMyTeam = (token) =>
  api.get("/teams/my", {
    headers: { Authorization: `Bearer ${token}` },
  });

export const addPlayers = (teamId, players, token) => {
  return api.put(`/teams/${teamId}/players`, { players }, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const editPlayer = (teamId, playerId, data, token) => {
  return api.put(`/teams/${teamId}/players/${playerId}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const removePlayer = (teamId, playerId, token) => {
  return api.delete(`/teams/${teamId}/players/${playerId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};