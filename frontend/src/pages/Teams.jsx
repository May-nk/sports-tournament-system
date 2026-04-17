import { useEffect, useState } from "react";
import { getTeams, createTeam, addPlayers } from "../services/teamService";

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [teamName, setTeamName] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [playerName, setPlayerName] = useState("");

  const token = localStorage.getItem("token");

  const fetchTeams = async () => {
    try {
      const res = await getTeams();
      setTeams(res.data);
    } catch (error) {
      console.error("Error fetching teams:", error);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      await createTeam({ name: teamName }, token);
      setTeamName("");
      fetchTeams();
    } catch (error) {
      console.error("Error creating team:", error.response?.data);
    }
  };

  const handleAddPlayer = async () => {
    try {
      await addPlayers(
        selectedTeam,
        [{ name: playerName, age: 20, position: "Player" }],
        token
      );
      setPlayerName("");
      fetchTeams();
    } catch (error) {
      console.error("Error adding player:", error.response?.data);
    }
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Teams</h1>

      {/* Create Team Form */}
      <form onSubmit={handleCreateTeam} className="mb-6 flex gap-2">
        <input
          type="text"
          placeholder="Enter team name"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          className="p-2 rounded bg-gray-800 flex-1"
        />
        <button type="submit" className="bg-blue-600 px-4 py-2 rounded">
          Create Team
        </button>
      </form>

      {/* Teams List */}
      {teams.length === 0 ? (
        <p className="text-gray-400">No teams found</p>
      ) : (
        <div className="grid gap-4">
          {teams.map((team) => (
            <div key={team._id} className="bg-gray-800 p-4 rounded-lg shadow">
              <h2 className="text-xl font-semibold">{team.name}</h2>
              <p className="text-gray-400 mb-3">
                Players: {team.players?.length || 0}
              </p>
              <button
                onClick={() =>
                  setSelectedTeam(selectedTeam === team._id ? null : team._id)
                }
                className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm"
              >
                {selectedTeam === team._id ? "Cancel" : "Add Players"}
              </button>

              {/* Add Player Form — shown only for selected team */}
              {selectedTeam === team._id && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    placeholder="Player name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="p-2 bg-gray-900 rounded flex-1"
                  />
                  <button
                    onClick={handleAddPlayer}
                    className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Teams;