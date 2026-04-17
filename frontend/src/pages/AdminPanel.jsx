import { useState } from "react";
import {
  getTeamsOfTournament,
  approveTeam,
  rejectTeam,
} from "../services/teamTournamentService";

const statusColor = (status) => {
  switch (status) {
    case "pending":  return "bg-yellow-700 text-yellow-100";
    case "approved": return "bg-green-700 text-green-100";
    case "rejected": return "bg-red-700 text-red-100";
    default:         return "bg-gray-600 text-gray-300";
  }
};

const AdminPanel = () => {
  const [tournamentId, setTournamentId] = useState("");
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const fetchApplications = async () => {
    if (!tournamentId.trim()) {
      alert("Please enter a Tournament ID.");
      return;
    }
    setLoading(true);
    try {
      const res = await getTeamsOfTournament(tournamentId.trim());
      setApplications(res.data);
    } catch (error) {
      console.error("Error fetching applications:", error.response?.data);
      alert(error.response?.data?.message || "Failed to load applications.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (applicationId) => {
    try {
      await approveTeam(applicationId, token);
      fetchApplications(); // refresh
    } catch (error) {
      console.error("Approve error:", error.response?.data);
      alert(error.response?.data?.message || "Failed to approve team.");
    }
  };

  const handleReject = async (applicationId) => {
    try {
      await rejectTeam(applicationId, token);
      fetchApplications(); // refresh
    } catch (error) {
      console.error("Reject error:", error.response?.data);
      alert(error.response?.data?.message || "Failed to reject team.");
    }
  };

  const pending = applications.filter((a) => a.status === "pending");
  const others = applications.filter((a) => a.status !== "pending");

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>

      {/* Tournament ID Input */}
      <div className="flex gap-2 mb-8">
        <input
          type="text"
          placeholder="Enter Tournament ID"
          value={tournamentId}
          onChange={(e) => setTournamentId(e.target.value)}
          className="flex-1 p-2 rounded bg-gray-800 text-white"
        />
        <button
          onClick={fetchApplications}
          className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded"
        >
          Load Applications
        </button>
      </div>

      {loading && <p className="text-gray-400">Loading...</p>}

      {!loading && applications.length > 0 && (
        <>
          {/* Pending Applications */}
          <h2 className="text-lg font-semibold mb-3 text-yellow-400">
            Pending ({pending.length})
          </h2>

          {pending.length === 0 ? (
            <p className="text-gray-400 mb-6">No pending applications.</p>
          ) : (
            <div className="grid gap-3 mb-8">
              {pending.map((app) => (
                <div
                  key={app._id}
                  className="bg-gray-800 p-4 rounded-lg flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold">{app.team?.name ?? "Unknown Team"}</p>
                    <p className="text-gray-400 text-sm">
                      Players: {app.team?.players?.length ?? 0}
                    </p>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 rounded text-xs capitalize ${statusColor(app.status)}`}
                    >
                      {app.status}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(app._id)}
                      className="bg-green-600 hover:bg-green-500 px-3 py-1.5 rounded text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(app._id)}
                      className="bg-red-700 hover:bg-red-600 px-3 py-1.5 rounded text-sm"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Approved / Rejected */}
          {others.length > 0 && (
            <>
              <h2 className="text-lg font-semibold mb-3 text-gray-300">
                Reviewed ({others.length})
              </h2>
              <div className="grid gap-3">
                {others.map((app) => (
                  <div
                    key={app._id}
                    className="bg-gray-800 p-4 rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <p className="font-semibold">{app.team?.name ?? "Unknown Team"}</p>
                      <p className="text-gray-400 text-sm">
                        Players: {app.team?.players?.length ?? 0}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-xs capitalize ${statusColor(app.status)}`}
                    >
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {!loading && tournamentId && applications.length === 0 && (
        <p className="text-gray-400">No applications found for this tournament.</p>
      )}
    </div>
  );
};

export default AdminPanel;
