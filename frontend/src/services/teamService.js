import api from "./api";

export const createTeam = (data, token) => {
  return api.post("/teams", data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getTeams = () => {
  return api.get("/teams");
};

export const addPlayers = (teamId, players, token) => {
  return api.put(`/teams/${teamId}/players`, { players }, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};