import { useEffect, useState } from "react";
import { getMatches, updateScore } from "../services/matchService";

const statusColor = (status) =>
  status === "completed"
    ? "bg-green-700 text-green-100"
    : "bg-yellow-700 text-yellow-100";

const Matches = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tournamentId, setTournamentId] = useState("");
  const [scores, setScores] = useState({}); // { matchId: { scoreA, scoreB } }

  const token = localStorage.getItem("token");

  const fetchMatches = async (tId) => {
    if (!tId) return;
    setLoading(true);
    try {
      const res = await getMatches(tId);
      setMatches(res.data);
    } catch (error) {
      console.error("Error fetching matches:", error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (matchId, field, value) => {
    setScores((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [field]: value,
      },
    }));
  };

  const handleUpdateScore = async (matchId) => {
    const matchScores = scores[matchId] || {};
    const scoreA = Number(matchScores.scoreA);
    const scoreB = Number(matchScores.scoreB);

    if (isNaN(scoreA) || isNaN(scoreB)) {
      alert("Please enter valid numbers for both scores.");
      return;
    }

    try {
      await updateScore(matchId, { scoreA, scoreB }, token);
      fetchMatches(tournamentId);
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to update score";
      alert(msg);
      console.error("Update score error:", error.response?.data);
    }
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-6">Matches</h1>

      {/* Tournament ID Input */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Enter Tournament ID"
          value={tournamentId}
          onChange={(e) => setTournamentId(e.target.value)}
          className="flex-1 p-2 rounded bg-gray-800 text-white"
        />
        <button
          onClick={() => fetchMatches(tournamentId)}
          className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded"
        >
          Load Matches
        </button>
      </div>

      {/* Loading */}
      {loading && <p className="text-gray-400">Loading matches...</p>}

      {/* Match Cards */}
      {!loading && matches.length === 0 && tournamentId && (
        <p className="text-gray-400">No matches found for this tournament.</p>
      )}

      <div className="grid gap-4">
        {matches.map((match) => (
          <div key={match._id} className="bg-gray-800 p-4 rounded-lg shadow">
            {/* Teams & Score */}
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-lg font-semibold">
                  {match.teamA?.name ?? "Team A"}{" "}
                  <span className="text-gray-400">vs</span>{" "}
                  {match.teamB?.name ?? "Team B"}
                </p>
                <p className="text-gray-400 text-sm">
                  Score: {match.scoreA} – {match.scoreB}
                </p>
                <p className="text-gray-400 text-sm">
                  Venue: {match.venue} &nbsp;|&nbsp; Round: {match.round ?? "—"}
                </p>
              </div>
              <span
                className={`text-xs font-medium px-2 py-1 rounded capitalize ${statusColor(
                  match.status
                )}`}
              >
                {match.status}
              </span>
            </div>

            {/* Score Update — only for scheduled matches */}
            {match.status !== "completed" && (
              <div className="mt-3 flex flex-wrap gap-2 items-center">
                <input
                  type="number"
                  placeholder="Score A"
                  value={scores[match._id]?.scoreA ?? ""}
                  onChange={(e) =>
                    handleScoreChange(match._id, "scoreA", e.target.value)
                  }
                  className="w-24 p-2 rounded bg-gray-900 text-white"
                />
                <input
                  type="number"
                  placeholder="Score B"
                  value={scores[match._id]?.scoreB ?? ""}
                  onChange={(e) =>
                    handleScoreChange(match._id, "scoreB", e.target.value)
                  }
                  className="w-24 p-2 rounded bg-gray-900 text-white"
                />
                <button
                  onClick={() => handleUpdateScore(match._id)}
                  className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded text-sm"
                >
                  Update Score
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Matches;
